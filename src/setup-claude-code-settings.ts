import { $ } from "bun";
import { homedir } from "os";

export async function setupClaudeCodeSettings() {
  const home = homedir();
  const settingsPath = `${home}/.claude/settings.json`;
  const credentialsPath = `${home}/.claude/.credentials.json`;
  console.log(`Setting up Claude settings at: ${settingsPath}`);

  // Ensure .claude directory exists
  console.log(`Creating .claude directory...`);
  await $`mkdir -p ${home}/.claude`.quiet();

  // Setup OAuth credentials if provided
  const useOAuth = process.env.INPUT_USE_OAUTH === "true";
  if (useOAuth) {
    const accessToken = process.env.INPUT_CLAUDE_ACCESS_TOKEN;
    const refreshToken = process.env.INPUT_CLAUDE_REFRESH_TOKEN;
    const expiresAt = process.env.INPUT_CLAUDE_EXPIRES_AT;

    if (!accessToken || !refreshToken || !expiresAt) {
      throw new Error("OAuth credentials (claude_access_token, claude_refresh_token, claude_expires_at) are required when use_oauth is true");
    }

    const credentials = {
      claudeAiOauth: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: parseInt(expiresAt),
        scopes: ["user:inference", "user:profile"],
        isMax: true
      }
    };

    console.log(`Setting up OAuth credentials...`);
    await $`echo ${JSON.stringify(credentials, null, 2)} > ${credentialsPath}`.quiet();
    console.log(`OAuth credentials saved successfully`);
  }

  let settings: Record<string, unknown> = {};
  try {
    const existingSettings = await $`cat ${settingsPath}`.quiet().text();
    if (existingSettings.trim()) {
      settings = JSON.parse(existingSettings);
      console.log(
        `Found existing settings:`,
        JSON.stringify(settings, null, 2),
      );
    } else {
      console.log(`Settings file exists but is empty`);
    }
  } catch (e) {
    console.log(`No existing settings file found, creating new one`);
  }

  settings.enableAllProjectMcpServers = true;
  console.log(`Updated settings with enableAllProjectMcpServers: true`);

  await $`echo ${JSON.stringify(settings, null, 2)} > ${settingsPath}`.quiet();
  console.log(`Settings saved successfully`);
}
