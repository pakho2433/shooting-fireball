# Tense Fireball Quest

A browser-based 2D pixel game for practising:

- Simple present
- Present continuous
- Simple past

## Play the game

**Game page:** https://pakho2433.github.io/shooting-fireball/

The game is designed for iPad, tablet and desktop browsers.

## How to play

1. Enter the student's **name, class and class number**.
2. Read the sentence at the top of the screen.
3. On iPad, move with the **on-screen joystick**. On a computer, use **WASD** or the **arrow keys**.
4. **Tap the game screen** on iPad, or left-click on a computer, to shoot toward a target.
5. Hit the moving monster carrying the correct verb form.
6. The fireball upgrades automatically at **50 points** and **100 points**.
7. There is no life limit. Students can keep trying.
8. If the same question is answered wrongly twice, the game displays a grammar hint.
9. After eight correct answers, defeat the Final Boss while avoiding its bullets.
10. When the game ends, the student's tense performance report is submitted to the teacher.

Press **P** on a computer to pause.

## Result report

The report includes:

- Student name, class and class number
- Final score and best streak
- First-try accuracy for each tense
- Wrong hits for each tense
- An automatic analysis of the tense or tenses that need more practice

The result receiver is configured in `student-report.js`.

## Run locally

Open `index.html` in a modern web browser. No build step or external dependency is required.

## GitHub Pages

In the repository settings, open **Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.

After deployment, the game is available at:

https://pakho2433.github.io/shooting-fireball/

## Edit the question bank

Open `game-core.js` and find the `QUESTION_BANK` array near the top. Each question has this format:

```js
{
  tense: "Simple Present",
  prompt: "Mary ________ to school every day.",
  choices: ["goes", "go", "went"],
  answer: 0
}
```

`answer` is the zero-based position of the correct choice.
