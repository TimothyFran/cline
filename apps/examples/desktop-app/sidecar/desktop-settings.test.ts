import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	readDesktopSettings,
	resolveDesktopSettingsPath,
	setCloudSessionsEnabled,
	setRunCommandsTimeoutSeconds,
} from "./desktop-settings";

let dataDir: string;

beforeEach(() => {
	dataDir = mkdtempSync(join(tmpdir(), "cline-desktop-settings-"));
	process.env.CLINE_DATA_DIR = dataDir;
});

afterEach(() => {
	delete process.env.CLINE_DATA_DIR;
	rmSync(dataDir, { recursive: true, force: true });
});

describe("desktop settings", () => {
	it("defaults cloud sessions to off and timeout to 30 when no settings file exists", () => {
		expect(readDesktopSettings()).toEqual({
			cloudSessionsEnabled: false,
			runCommandsTimeoutSeconds: 30,
		});
	});

	it("persists the cloud sessions opt-in and reads it back", () => {
		expect(setCloudSessionsEnabled(true)).toEqual({
			cloudSessionsEnabled: true,
			runCommandsTimeoutSeconds: 30,
		});
		expect(readDesktopSettings()).toEqual({
			cloudSessionsEnabled: true,
			runCommandsTimeoutSeconds: 30,
		});
		expect(resolveDesktopSettingsPath().endsWith("code-settings.json")).toBe(
			true,
		);
		expect(
			JSON.parse(readFileSync(resolveDesktopSettingsPath(), "utf8")),
		).toMatchObject({ cloudSessionsEnabled: true });
		expect(setCloudSessionsEnabled(false)).toEqual({
			cloudSessionsEnabled: false,
			runCommandsTimeoutSeconds: 30,
		});
		expect(readDesktopSettings()).toEqual({
			cloudSessionsEnabled: false,
			runCommandsTimeoutSeconds: 30,
		});
	});

	it("persists the run commands timeout and reads it back", () => {
		expect(setRunCommandsTimeoutSeconds(120)).toEqual({
			cloudSessionsEnabled: false,
			runCommandsTimeoutSeconds: 120,
		});
		expect(readDesktopSettings()).toEqual({
			cloudSessionsEnabled: false,
			runCommandsTimeoutSeconds: 120,
		});
		expect(
			JSON.parse(readFileSync(resolveDesktopSettingsPath(), "utf8")),
		).toMatchObject({ runCommandsTimeoutSeconds: 120 });
	});

	it("rejects non-positive or non-finite timeouts and falls back to the default", () => {
		expect(setRunCommandsTimeoutSeconds(0)).toMatchObject({
			runCommandsTimeoutSeconds: 30,
		});
		expect(setRunCommandsTimeoutSeconds(-5)).toMatchObject({
			runCommandsTimeoutSeconds: 30,
		});
		expect(setRunCommandsTimeoutSeconds(Number.NaN)).toMatchObject({
			runCommandsTimeoutSeconds: 30,
		});
	});

	it("treats malformed files and non-boolean values as off", () => {
		mkdirSync(dirname(resolveDesktopSettingsPath()), { recursive: true });
		writeFileSync(resolveDesktopSettingsPath(), "{not json", "utf8");
		expect(readDesktopSettings()).toEqual({
			cloudSessionsEnabled: false,
			runCommandsTimeoutSeconds: 30,
		});
		writeFileSync(
			resolveDesktopSettingsPath(),
			JSON.stringify({ cloudSessionsEnabled: "yes" }),
			"utf8",
		);
		expect(readDesktopSettings()).toEqual({
			cloudSessionsEnabled: false,
			runCommandsTimeoutSeconds: 30,
		});
	});

	it("treats non-numeric timeouts as the default", () => {
		mkdirSync(dirname(resolveDesktopSettingsPath()), { recursive: true });
		writeFileSync(
			resolveDesktopSettingsPath(),
			JSON.stringify({ runCommandsTimeoutSeconds: "fast" }),
			"utf8",
		);
		expect(readDesktopSettings()).toEqual({
			cloudSessionsEnabled: false,
			runCommandsTimeoutSeconds: 30,
		});
	});
});
