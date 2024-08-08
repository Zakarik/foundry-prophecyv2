export const registerSettings = function () {
    game.settings.register("prophecy-2e", "msgwear", {
        name: "PROPHECY.SETTINGS.MsgWear",
        hint: "PROPHECY.SETTINGS.MsgWearHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });

    game.settings.register("prophecy-2e", "background", {
        name: "PROPHECY.SETTINGS.Background",
        hint: "PROPHECY.SETTINGS.BackgroundHint",
        scope: "client",
        config: true,
        type: String,
        default: '#A0522d',
        requiresReload: true
    });
}