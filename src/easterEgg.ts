import readline from 'readline';

export async function runFlappyBird(): Promise<void> {
    return new Promise((resolve) => {
        const width = 40;
        const height = 20;
        let birdY = 10;
        let birdVelocity = 0;
        let pipes: { x: number; gapTop: number }[] = [{ x: 30, gapTop: 8 }];
        let score = 0;
        let gameOver = false;

        const gravity = 0.15;
        const jumpStrength = -0.7;

        process.stdin.setRawMode(true);
        process.stdin.resume();
        readline.emitKeypressEvents(process.stdin);

        const handleInput = (str: string, key: any) => {
            if (key.name === 'space') {
                birdVelocity = jumpStrength;
            } else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
                exitGame();
            }
        };

        process.stdin.on('keypress', handleInput);

        const exitGame = () => {
            process.stdin.removeListener('keypress', handleInput);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            clearInterval(gameInterval);
            console.clear();
            console.log(`Game Over! Score: ${score}`);
            resolve();
        };

        let frame = 0;
        const update = () => {
            if (gameOver) return;
            frame++;

            birdVelocity += gravity;
            birdY += birdVelocity;

            // Move pipes every 2 frames to slow down
            if (frame % 2 === 0) {
                pipes.forEach(pipe => pipe.x--);
            }
            if (pipes[0].x < 0) {
                pipes.shift();
                score++;
                pipes.push({ x: width - 1, gapTop: Math.floor(Math.random() * (height - 8)) + 2 });
            }

            // Collision check
            if (birdY < 0 || birdY >= height) {
                gameOver = true;
            }
            pipes.forEach(pipe => {
                if (pipe.x === 5) {
                    if (birdY < pipe.gapTop || birdY > pipe.gapTop + 4) {
                        gameOver = true;
                    }
                }
            });

            if (gameOver) {
                exitGame();
                return;
            }

            draw();
        };

        const draw = () => {
            let output = '';
            console.clear();
            output += `Score: ${score} | Press SPACE to Jump, Q to Quit\n`;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let char = ' ';
                    if (x === 5 && Math.floor(birdY) === y) {
                        char = 'B';
                    } else {
                        pipes.forEach(pipe => {
                            if (x === pipe.x) {
                                if (y < pipe.gapTop || y > pipe.gapTop + 4) {
                                    char = '█';
                                }
                            }
                        });
                    }
                    output += char;
                }
                output += '\n';
            }
            process.stdout.write(output);
        };

        const gameInterval = setInterval(update, 100);
    });
}
