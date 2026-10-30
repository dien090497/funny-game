package com.n03bt1.funnygame.score;

public record SubmitScoreRequest(
        String playerName,
        String game,
        Long score,
        String extra   // nullable
) {
    public SubmitScoreRequest withPlayerName(String name) {
        return new SubmitScoreRequest(name, game, score, extra);
    }
}
