import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";
import { hashPassword, signSessionToken, setAuthCookie } from "@/lib/auth";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const body = await request.json();
    const { username, email, name, password, confirmPassword } = body;

    // 1. Username validation
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(cleanUsername)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-20 characters long and can only contain lowercase letters, numbers, and underscores (e.g. john_doe).",
        },
        { status: 400 }
      );
    }

    // 2. Email validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 3. Password & Confirm Password validation
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match. Please re-enter carefully." },
        { status: 400 }
      );
    }

    const cleanName =
      name && typeof name === "string" && name.trim().length > 0
        ? name.trim()
        : cleanUsername;

    // 4. Check if username is already taken
    const existingByUsername = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    // Check if email already exists
    const existingByEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingByUsername) {
      // If the existing user is the same unhashed account being claimed
      if (
        existingByEmail &&
        existingByUsername.id === existingByEmail.id &&
        !existingByEmail.passwordHash
      ) {
        // Allowed to proceed with claim below
      } else {
        return NextResponse.json(
          { error: "This username is already taken. Please choose another." },
          { status: 409 }
        );
      }
    }

    let targetUser;

    if (existingByEmail) {
      // If user exists but has no password set (e.g. initial account being claimed)
      if (!existingByEmail.passwordHash) {
        const hashedPassword = await hashPassword(password);
        targetUser = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            username: cleanUsername,
            name: cleanName,
            passwordHash: hashedPassword,
          },
        });
      } else {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
    } else {
      // First registered user gets ADMIN role, subsequent get USER
      const userCount = await prisma.user.count();
      const role = userCount === 0 ? "ADMIN" : "USER";
      const hashedPassword = await hashPassword(password);

      targetUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          name: cleanName,
          passwordHash: hashedPassword,
          role,
        },
      });
    }

    // Sign session and set cookie
    const token = await signSessionToken({
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
