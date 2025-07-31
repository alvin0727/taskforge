export function getAxiosErrorMessage(err: unknown): string {
    if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as any).response?.data?.detail?.message
    ) {
        const detail = (err as any).response.data.detail;
        let message = detail.message;
        if (detail.remaining_attempts !== undefined) {
            message += ` (${detail.remaining_attempts} attempts left)`;
        }
        return message;
    }
    return "Something went wrong";
}