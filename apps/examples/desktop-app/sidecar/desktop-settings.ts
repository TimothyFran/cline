import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveClineDataDir } from "@cline/shared/storage";

/** Desktop-only preferences kept separate from strict shared global settings. */
export type DesktopSettings = {
	/** Opt-in gate for cloud sessions while the feature is in preview. */
	cloudSessionsEnabled: boolean;
	/** Timeout in seconds applied to the `run_commands` tool. */
	runCommandsTimeoutSeconds: number;
};

const DEFAULT_RUN_COMMANDS_TIMEOUT_SECONDS = 30;

const DEFAULT_SETTINGS: DesktopSettings = {
	cloudSessionsEnabled: false,
	runCommandsTimeoutSeconds: DEFAULT_RUN_COMMANDS_TIMEOUT_SECONDS,
};

export function resolveDesktopSettingsPath(): string {
	return join(resolveClineDataDir(), "settings", "code-settings.json");
}

function resolveRunCommandsTimeoutSeconds(value: unknown): number {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
		return DEFAULT_RUN_COMMANDS_TIMEOUT_SECONDS;
	}
	return Math.floor(value);
}

export function readDesktopSettings(): DesktopSettings {
	let raw: string;
	try {
		raw = readFileSync(resolveDesktopSettingsPath(), "utf8");
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		return {
			cloudSessionsEnabled: parsed.cloudSessionsEnabled === true,
			runCommandsTimeoutSeconds: resolveRunCommandsTimeoutSeconds(
				parsed.runCommandsTimeoutSeconds,
			),
		};
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

export function writeDesktopSettings(settings: DesktopSettings): void {
	const filePath = resolveDesktopSettingsPath();
	mkdirSync(dirname(filePath), { recursive: true });
	// Avoid leaving torn settings if the process exits mid-write.
	const tempPath = `${filePath}.${process.pid}.tmp`;
	writeFileSync(tempPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
	renameSync(tempPath, filePath);
}

export function setCloudSessionsEnabled(enabled: boolean): DesktopSettings {
	const next = { ...readDesktopSettings(), cloudSessionsEnabled: enabled };
	writeDesktopSettings(next);
	return next;
}

export function setRunCommandsTimeoutSeconds(seconds: number): DesktopSettings {
	const next = {
		...readDesktopSettings(),
		runCommandsTimeoutSeconds: resolveRunCommandsTimeoutSeconds(seconds),
	};
	writeDesktopSettings(next);
	return next;
}
