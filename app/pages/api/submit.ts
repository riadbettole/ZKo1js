import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { upsertRecord, getRecord } from "@/lib/db";

