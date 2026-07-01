# Tense Fireball Quest

A browser-based 2D pixel game for practising:

- Simple present
- Present continuous
- Simple past

## How to play

1. Read the sentence at the top of the screen.
2. Move with **WASD** or the **arrow keys**.
3. Aim with the mouse and **left-click** to shoot a fireball.
4. Hit the monster carrying the correct verb form.
5. Every correct answer earns points and upgrade energy.
6. Spend 50 energy to upgrade the fireball by pressing **U**.
7. After eight correct answers, defeat the Final Boss while avoiding its bullets.

Press **P** to pause.

## Run locally

Open `index.html` in a modern web browser. No build step or external dependency is required.

## GitHub Pages

In the repository settings, open **Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.

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
