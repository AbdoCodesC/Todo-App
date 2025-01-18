import { Router } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import prisma from "../prismaClient.js"

const router = Router()
const saltRounds = 10

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
        token: null,
      })
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    })

    // Create default todo for new user
    await prisma.todo.create({
      data: {
        task: "Welcome! Add your first todo!",
        userId: user.id,
      },
    })

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    })

    res.status(201).json({
      message: "User created successfully",
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(503).json({
      message: "Error creating user",
      token: null,
    })
  }
})

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        token: null,
      })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid password",
        token: null,
      })
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    })

    res.status(200).json({
      message: "Login successful",
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(503).json({
      message: "Error during login",
      token: null,
    })
  }
})

export default router
