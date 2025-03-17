"use server";

import { serverApi } from "@/lib/api";
import { CreateUserDto } from "@eclairum/backend/dtos";

export async function createUser(data: CreateUserDto) {
  try {
    const response = await serverApi.post("/users", data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error in createUser server action:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
