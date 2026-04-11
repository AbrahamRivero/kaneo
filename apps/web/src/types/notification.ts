import type { client } from "@palcodesk/libs";
import type { InferResponseType } from "hono/client";
export type Notification = Extract<
  InferResponseType<(typeof client)["notification"]["$get"]>[number],
  { id: string }
>;
