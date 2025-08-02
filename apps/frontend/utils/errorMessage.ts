export function getAxiosErrorMessage(err: unknown): string {
    if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as any).response?.data?.detail
    ) {
        const res = (err as any).response;
        const detail = res.data.detail;
        // If error 500, return detail as string if possible
        if (res.status === 500) {
            return "Internal server error. Please try again later.";
        }
        // For other errors, use message field if available
        if (detail?.message) {
            let message = detail.message;
            if (detail.remaining_attempts !== undefined) {
                message += ` (${detail.remaining_attempts} attempts left)`;
            }
            return message;
        }
    }
    return "Something went wrong. Please try again later.";
}