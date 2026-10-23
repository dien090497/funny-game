package com.n03bt1.funnygame;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class GameController {

    @GetMapping("/")
    public String hub() {
        return "index";
    }

    @GetMapping("/games/memory")
    public String memory() {
        return "games/memory";
    }

    @GetMapping("/games/2048")
    public String game2048() {
        return "games/game2048";
    }

    @GetMapping("/games/snake")
    public String snake() {
        return "games/snake";
    }

    @GetMapping("/games/arena")
    public String arena() {
        return "games/arena";
    }
}
