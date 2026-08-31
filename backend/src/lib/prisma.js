'use strict';

require('dotenv/config');

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { getPrismaClient } = require('@prisma/client/runtime/client');

// ---------------------------------------------------------------------------
// Replicate the generated config from generated/prisma/internal/class.ts
// This lets us use the Prisma 7 runtime from plain CJS without needing a TS
// build step or jiti.
// ---------------------------------------------------------------------------
const config = {
  previewFeatures: [],
  clientVersion: '7.10.0',
  engineVersion: '0edf323efd1d98336f3f0a68684b56f689b900d3',
  activeProvider: 'postgresql',
  inlineSchema: `generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Booking {
  id              Int      @id @default(autoincrement())
  name            String
  email           String
  company         String
  jobTitle        String
  phone           String?
  startTime       DateTime
  endTime         DateTime
  timezone        String
  status          String   @default("CONFIRMED")
  rescheduleToken String   @unique
  cancelToken     String   @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([startTime])
  @@index([status])
}
`,
  runtimeDataModel: JSON.parse(
    '{"models":{"Booking":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"company","kind":"scalar","type":"String"},{"name":"jobTitle","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"startTime","kind":"scalar","type":"DateTime"},{"name":"endTime","kind":"scalar","type":"DateTime"},{"name":"timezone","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"rescheduleToken","kind":"scalar","type":"String"},{"name":"cancelToken","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null,"schema":null}},"enums":{},"types":{}}'
  ),
  parameterizationSchema: {
    strings: JSON.parse(
      '["where","Booking.findUnique","Booking.findUniqueOrThrow","orderBy","cursor","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","data","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","create","update","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","having","_count","_avg","_sum","_min","_max","Booking.groupBy","Booking.aggregate","AND","OR","NOT","id","name","email","company","jobTitle","phone","startTime","endTime","timezone","status","rescheduleToken","cancelToken","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","set","increment","decrement","multiply","divide"]'
    ),
    graph:
      'NwsQERwAACkAMB0AAAQAEB4AACkAMB8CAAAAASABACsAISEBACsAISIBACsAISMBACsAISQBACwAISVAAC0AISZAAC0AIScBACsAISgBACsAISkBAAAAASoBAAAAAStAAC0AISxAAC0AIQEAAAABACABAAAAAQAgERwAACkAMB0AAAQAEB4AACkAMB8CACoAISABACsAISEBACsAISIBACsAISMBACsAISQBACwAISVAAC0AISZAAC0AIScBACsAISgBACsAISkBACsAISoBACsAIStAAC0AISxAAC0AIQEkAAAuACADAAAABAAgAwAABQAwBAAAAQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACAOHwIAAAABIAEAAAABIQEAAAABIgEAAAABIwEAAAABJAEAAAABJUAAAAABJkAAAAABJwEAAAABKAEAAAABKQEAAAABKgEAAAABK0AAAAABLEAAAAABAQgAAAkAIA4fAgAAAAEgAQAAAAEhAQAAAAEiAQAAAAEjAQAAAAEkAQAAAAElQAAAAAEmQAAAAAEnAQAAAAEoAQAAAAEpAQAAAAEqAQAAAAErQAAAAAEsQAAAAAEBCAAACwAwAQgAAAsAMA4fAgA3ACEgAQA0ACEhAQA0ACEiAQA0ACEjAQA0ACEkAQA1ACElQAA2ACEmQAA2ACEnAQA0ACEoAQA0ACEpAQA0ACEqAQA0ACErQAA2ACEsQAA2ACECAAAAAQAgCAAADgAgDh8CADcAISABADQAISEBADQAISIBADQAISMBADQAISQBADUAISVAADYAISZAADYAIScBADQAISgBADQAISkBADQAISoBADQAIStAADYAISxAADYAIQIAAAAEACAIAAAQACACAAAABAAgCAAAEAAgAwAAAAEAIA8AAAkAIBAAAA4AIAEAAAABACABAAAABAAgBhUAAC8AIBYAADAAIBcAADMAIBgAADIAIBkAADEAICQAAC4AIBEcAAAaADAdAAAXABAeAAAaADAfAgAbACEgAQAcACEhAQAcACEiAQAcACEjAQAcACEkAQAdACElQAAeACEmQAAeACEnAQAcACEoAQAcACEpAQAcACEqAQAcACErQAAeACEsQAAeACEDAAAABAAgAwAAFgAwFAAAFwAgAwAAAAQAIAMAAAUAMAQAAAEAIBEcAAAaADAdAAAXABAeAAAaADAfAgAbACEgAQAcACEhAQAcACEiAQAcACEjAQAcACEkAQAdACElQAAeACEmQAAeACEnAQAcACEoAQAcACEpAQAcACEqAQAcACErQAAeACEsQAAeACENFQAAIAAgFgAAKAAgFwAAIAAgGAAAIAAgGQAAIAAgLQIAAAABLgIAAAAELwIAAAAEMAIAAAABMQIAAAABMgIAAAABMwIAAAABNAIAJwAhDhUAACAAIBgAACYAIBkAACYAIC0BAAAAAS4BAAAABC8BAAAABDABAAAAATEBAAAAATIBAAAAATMBAAAAATQBACUAITUBAAAAATYBAAAAATcBAAAAAQ4VAAAjACAYAAAkACAZAAAkACAtAQAAAAEuAQAAAAUvAQAAAAUwAQAAAAExAQAAAAEyAQAAAAEzAQAAAAE0AQAiACE1AQAAAAE2AQAAAAE3AQAAAAELFQAAIAAgGAAAIQAgGQAAIQAgLUAAAAABLkAAAAAEL0AAAAAEMEAAAAABMUAAAAABMkAAAAABM0AAAAABNEAAHwAhCxUAACAAIBgAACEAIBkAACEAIC1AAAAAAS5AAAAABC9AAAAABDBAAAAAATFAAAAAATJAAAAAATNAAAAAATRAAB8AIQgtAgAAAAEuAgAAAAQvAgAAAAQwAgAAAAExAgAAAAEyAgAAAAEzAgAAAAE0AgAgACEILUAAAAABLkAAAAAEL0AAAAAEMEAAAAABMUAAAAABMkAAAAABM0AAAAABNEAAIQAhDhUAACMAIBgAACQAIBkAACQAIC0BAAAAAS4BAAAABS8BAAAABTABAAAAATEBAAAAATIBAAAAATMBAAAAATQBACIAITUBAAAAATYBAAAAATcBAAAAAQgtAgAAAAEuAgAAAAUvAgAAAAUwAgAAAAExAgAAAAEyAgAAAAEzAgAAAAE0AgAjACELLQEAAAABLgEAAAAFLwEAAAAFMAEAAAABMQEAAAABMgEAAAABMwEAAAABNAEAJAAhNQEAAAABNgEAAAABNwEAAAABDhUAACAAIBgAACYAIBkAACYAIC0BAAAAAS4BAAAABC8BAAAABDABAAAAATEBAAAAATIBAAAAATMBAAAAATQBACUAITUBAAAAATYBAAAAATcBAAAAAQstAQAAAAEuAQAAAAQvAQAAAAQwAQAAAAExAQAAAAEyAQAAAAEzAQAAAAE0AQAmACE1AQAAAAE2AQAAAAE3AQAAAAENFQAAIAAgFgAAKAAgFwAAIAAgGAAAIAAgGQAAIAAgLQIAAAABLgIAAAAELwIAAAAEMAIAAAABMQIAAAABMgIAAAABMwIAAAABNAIAJwAhCC0IAAAAAS4IAAAABC8IAAAABDAIAAAAATEIAAAAATIIAAAAATMIAAAAATQIACgAIREcAAApADAdAAAEABAeAAApADAfAgAqACEgAQArACEhAQArACEiAQArACEjAQArACEkAQAsACElQAAtACEmQAAtACEnAQArACEoAQArACEpAQArACEqAQArACErQAAtACEsQAAtACEILQIAAAABLgIAAAAELwIAAAAEMAIAAAABMQIAAAABMgIAAAABMwIAAAABNAIAIAAhCy0BAAAAAS4BAAAABC8BAAAABDABAAAAATEBAAAAATIBAAAAATMBAAAAATQBACYAITUBAAAAATYBAAAAATcBAAAAAQstAQAAAAEuAQAAAAUvAQAAAAUwAQAAAAExAQAAAAEyAQAAAAEzAQAAAAE0AQAkACE1AQAAAAE2AQAAAAE3AQAAAAEILUAAAAABLkAAAAAEL0AAAAAEMEAAAAABMUAAAAABMkAAAAABM0AAAAABNEAAIQAhAAAAAAAAATgBAAAAAQE4AQAAAAEBOEAAAAABBTgCAAAAATkCAAAAAToCAAAAATsCAAAAATwCAAAAAQAAAAAFFQAGFgAHFwAIGAAJGQAKAAAAAAAFFQAGFgAHFwAIGAAJGQAKAQIBAgMBBQYBBgcBBwgBCQoBCgwCCw0DDA8BDRECDhIEERMBEhQBExUCGhgFGxkL',
  },
};

// Attach the WASM compiler for PostgreSQL (Prisma 7 driver-adapter path)
config.compilerWasm = {
  getRuntime: async () =>
    await import(
      '@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs'
    ),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import(
      '@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs'
    );
    const { Buffer } = await import('node:buffer');
    const wasmArray = Buffer.from(wasm, 'base64');
    return new WebAssembly.Module(wasmArray);
  },
  importName: './query_compiler_fast_bg.js',
};

// ---------------------------------------------------------------------------
// Build the PrismaClient class and instantiate a singleton
// ---------------------------------------------------------------------------
const PrismaClientClass = getPrismaClient(config);

// Use a connection pool shared across requests
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClientClass({ adapter });

module.exports = { prisma };
