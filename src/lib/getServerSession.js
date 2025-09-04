// File: c:\hackathon\src\lib\getServerSession.js
import { getServerSession as nextAuthGetServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions);
}