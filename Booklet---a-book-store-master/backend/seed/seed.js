import dotenv from "dotenv";
import mongoose from "mongoose";
import slugify from "slugify";
import fs from "fs";
import path from "path";

import connectDB from "../config/db.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import { ROLE } from "../utils/roleUtils.js";

const envResult = dotenv.config();
if (envResult.error) {
  console.warn("⚠️  Could not load backend/.env. Using process.env instead.");
}

const manningBooksPath = path.resolve("./backend/seed/manning-books.json");
let manningBooks = [];
if (fs.existsSync(manningBooksPath)) {
  try {
    const raw = fs.readFileSync(manningBooksPath, "utf-8");
    const data = JSON.parse(raw);
    if (data.books && Array.isArray(data.books)) {
      manningBooks = data.books.map((bookArray) => {
        if (Array.isArray(bookArray) && bookArray.length > 0) {
          return bookArray[0];
        }
        return null;
      }).filter(Boolean);
    }
  } catch (error) {
    console.warn("⚠️  Could not parse manning-books.json:", error.message);
  }
} else {
  console.warn("⚠️  Missing backend/seed/manning-books.json. Skipping dataset.");
}

const bookCategories = [
  "Fiction",
  "Non-Fiction",
  "Science & Technology",
  "Business & Economics",
  "Self-Help & Motivation",
  "Mystery & Thriller",
  "Biography & Memoir"
];

const manningProducts = manningBooks.map((book, index) => {
  const authors = Array.isArray(book.authors)
    ? book.authors.map(a => a.name).filter(Boolean).join(", ")
    : "";
  const title = book.title || "Untitled";
  const subtitle = book.subtitle ? ` - ${book.subtitle}` : "";
  const description = `${title}${subtitle}${authors ? ` by ${authors}` : ""}`;
  const price = Number((Math.random() * 800 + 150).toFixed(0)); // Price in INR
  const imageUrl = book.image || ""; // Use only database images
  const randomCategory = bookCategories[index % bookCategories.length];

  return {
    name: title,
    description,
    price,
    category: randomCategory,
    quantity: Math.max(10, Math.min(100, 20)),
    shipping: true,
    imageUrl: imageUrl,
  };
});

const categories = Array.from(
  new Set([
    ...manningProducts.map((product) => product.category).filter(Boolean),
  ])
);

const products = [...manningProducts];

const seed = async () => {
  try {
    await connectDB();

    const existingCategories = await categoryModel.find({});
    const categoryMap = new Map(
      existingCategories.map((cat) => [cat.name, cat])
    );

    for (const name of categories) {
      if (!categoryMap.has(name)) {
        const newCategory = await categoryModel.create({
          name,
          slug: slugify(name),
        });
        categoryMap.set(name, newCategory);
      }
    }

    for (const product of products) {
      const productSlug = slugify(product.name);
      const categoryDoc = categoryMap.get(product.category);
      if (!categoryDoc) {
        continue;
      }

      const payload = {
        name: product.name,
        slug: productSlug,
        description: product.description,
        price: product.price,
        category: categoryDoc._id,
        quantity: product.quantity,
        shipping: product.shipping,
        imageUrl: product.imageUrl || "",
      };

      await productModel.updateOne(
        { slug: productSlug },
        { $set: payload },
        { upsert: true }
      );
    }

    const superAdminEmail = "superadmin@booklet.test";
    const superAdminExists = await userModel.findOne({ email: superAdminEmail });
    if (!superAdminExists) {
      const passwordHash = await hashPassword("superadmin@123");
      await userModel.create({
        name: "Super Admin",
        email: superAdminEmail,
        password: passwordHash,
        phone: "9999990000",
        address: "Superadmin Address",
        answer: "blue",
        role: ROLE.SUPERADMIN,
      });
    }

    const adminEmail = "admin@booklet.test";
    const adminExists = await userModel.findOne({ email: adminEmail });
    if (!adminExists) {
      const passwordHash = await hashPassword("Admin@123");
      await userModel.create({
        name: "Admin User",
        email: adminEmail,
        password: passwordHash,
        phone: "9999999999",
        address: "Admin Address",
        answer: "blue",
        role: ROLE.ADMIN,
      });
    }

    const userEmail = "user@booklet.test";
    const userExists = await userModel.findOne({ email: userEmail });
    if (!userExists) {
      const passwordHash = await hashPassword("User@123");
      await userModel.create({
        name: "Sample User",
        email: userEmail,
        password: passwordHash,
        phone: "8888888888",
        address: "Sample Address",
        answer: "blue",
        role: ROLE.CUSTOMER,
      });
    }

    const categoryCount = await categoryModel.countDocuments();
    const productCount = await productModel.countDocuments();
    const userCount = await userModel.countDocuments();

    console.log("✅ Seed completed");
    console.log(`Categories: ${categoryCount}`);
    console.log(`Products: ${productCount}`);
    console.log(`Users: ${userCount}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
