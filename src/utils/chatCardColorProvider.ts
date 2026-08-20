
export const chatCardColorProvider = (isMe: boolean) => {
    let color = "white"

    if (isMe) {
        color = "blue.6"
    }

    return color
}