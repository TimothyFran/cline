import type { ToolApprovalRequest, ToolApprovalResult } from "@cline/shared";
import type { ToolExecutors } from "../../extensions/tools";

export interface RuntimeCapabilities {
	toolExecutors?: Partial<ToolExecutors>;
	requestToolApproval?: (
		request: ToolApprovalRequest,
	) => Promise<ToolApprovalResult> | ToolApprovalResult;
	/**
	 * Timeout in milliseconds applied to the built-in `run_commands` tool.
	 * When unset, the SDK default (30000 ms) applies. Hosts that execute
	 * commands through their own `bash` executor are unaffected; the built-in
	 * shell executor honors both this value and its own process-kill timer.
	 */
	runCommandsTimeoutMs?: number;
}
