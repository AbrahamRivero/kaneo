import { client } from "@palcodesk/libs";
const getWorkspaces = async () => {
  const response = await client.workspace.$get();
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  const workspaces = await response.json();
  return workspaces;
};
export default getWorkspaces;
