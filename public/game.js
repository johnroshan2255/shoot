
        const socket = io();
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('username');

        if (username) {
            socket.emit('joinRoom', username);
        } else {
            window.location.href = '/';
        }

        function preventScroll(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        window.addEventListener('scroll', preventScroll, { passive: false });
        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });

        let players = {};
        let bullets = [];

        let mouseX = 0;
        let mouseY = 0;

        let characterLeft = new Image;
        let characterRight = new Image;
        let characterUp = new Image;
        let characterDown = new Image;
        let gunImage = new Image;

        const backgroundImage = new Image();
        backgroundImage.src = '/background.png';

        const background = {
            x: 0,
            y: 0
        };

        let obj1Image = new Image;
        let obj2Image = new Image;
        let obj3Image = new Image;
        let obj4Image = new Image;

        obj1Image.src = '/obj-1.png';
        obj2Image.src = '/obj-2.png';
        obj3Image.src = '/obj-3.png';
        obj4Image.src = '/obj-4.png';

        const objects = [
            { x: 1300, y: 1200, width: 150, height: 300, image: obj4Image },
            { x: 200, y: 300, width: 150, height: 300, image: obj1Image },
            { x: 300, y: 1000, width: 150, height: 300, image: obj3Image },
            { x: 800, y: 500, width: 150, height: 300, image: obj2Image },
        ];

        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

        const drawBackground = () => {
            // ctx.drawImage(backgroundImage, background.x, background.y, canvas.width, canvas.height);
        };

        const viewport = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight
        };

        window.addEventListener('resize', () => {
            viewport.width = window.innerWidth;
            viewport.height = window.innerHeight;
        });

        characterLeft.src = '/character-left.png';
        characterRight.src = '/character-right.png';
        characterUp.src = '/character-up.png';
        characterDown.src = '/character-down.png';

        gunImage.src = '/gun.png';

        const characterImages = {
            left: characterLeft, 
            right: characterRight,
            up: characterUp,
            down: characterDown,
        };

        const drawPlayers = () => {
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            Object.values(players).forEach(({ x, y, color, score, direction, gun, username, id , life}) => {
                // drawBackground();
                drawGameStatusBar(username, score, life);
                ctx.fillStyle = 'black';
                ctx.fillText(`Score: ${score}`, x , y);
                ctx.fillText(`life: ${life}`, x-10 , y-10);
                drawObjects();
                drawCharacter(x, y, direction);
                drawGun(gun, id);
                updatePlayerGun();
            });
        };

        const isColliding = (x, y, object, player) => {
            
            return (
                x < object.x + object.width &&
                x + 50 > object.x &&
                y < object.y + object.height &&
                y + 50 > object.y
            );
        }

        const isBulletColliding = (x, y, object, player) => {
            
            return (
                x < object.x + object.width &&
                x + 0 > object.x &&
                y < object.y + object.height &&
                y + 0 > object.y
            );
        }

        const isObjectColliding = (obj1, obj2) => {
            return (
                obj1.x < obj2.x + obj2.width &&
                obj1.x + obj1.width > obj2.x &&
                obj1.y < obj2.y + obj2.height &&
                obj1.y + obj1.height > obj2.y
            );
        };

        const drawObjects = () => {
            // for (let i = 0; i < objects.length; i++) {
                for (let j = 0; j < objects.length; j++) {
                    // if (isObjectColliding(objects[i], objects[j])) {
                    //     drawObjects();
                    //     continue;
                    // }
                    ctx.drawImage(objects[j].image, objects[j].x, objects[j].y, objects[j].width, objects[j].height);
                }
            // }
        }

        const drawGameStatusBar = (username, score, life) => {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = 'black';
            ctx.fillRect(0,0, 100, 200);

            ctx.globalAlpha = 1.0;

            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            ctx.fillText(`Username: ${username}`, 10, 10);
            ctx.fillText(`Score: ${score}`, 10, 40);
            ctx.fillText(`Life: ${life}`, 10, 70);
        }

        const focusOnPlayer = (playerId) => {
            const player = players[playerId];
            if (player) {
                // Center the player in the viewport
                const targetViewportX = player.x ;
                const targetViewportY = player.y;

                // Adjust the background position to create the scrolling effect
                background.x = -targetViewportX;
                background.y = -targetViewportY;
            }
        };

        const drawCharacter = (x, y, direction) => {

            for (const obj of objects) {
                if (isColliding(x, y, obj, {})) {
                    drawCharacter(x+10, y+10, direction)
                }
            }

            const image = characterImages[direction] || characterImages.down;
            ctx.drawImage(image, x, y, 40, 40);

            // ctx.strokeStyle = 'red';
            // ctx.lineWidth = 2;
            // ctx.strokeRect(x - 30, y-30, 100, 100);
        };

        const drawBullets = () => {
            ctx.fillStyle = 'black';
            bullets.forEach(({ x, y }) => {
                ctx.beginPath();
                ctx.arc(x+30, y+25, 5, 0, 2 * Math.PI);
                ctx.fill();
            });
        };

        const drawGun = (gun, playerId) => {
            if (playerId === socket.id) {
                // Only calculate angle for the current player's gun
                const angle = Math.atan2(mouseY - gun.y, mouseX - gun.x);
                ctx.save();
                ctx.translate(gun.x, gun.y);
                ctx.rotate(angle);
                ctx.drawImage(gunImage, -4, -30, 60, 60);
                ctx.restore();
            } else {
                // For other players, just draw the gun at its current position and rotation
                ctx.save();
                ctx.translate(gun.x, gun.y);
                ctx.rotate(gun.angle || 0);
                ctx.drawImage(gunImage, -4, -30, 60, 60);
                ctx.restore();
            }
        };

        const updateBullets = () => {
            bullets.forEach((bullet, index) => {
                for (const obj of objects) {
                    if (isBulletColliding(bullet.x, bullet.y, obj, {})) {
                        bullets.splice(index, 1);
                        return;
                    }
                }
                bullet.x += bullet.dx;
                bullet.y += bullet.dy;
                if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
                    bullets.splice(index, 1);
                }
                Object.entries(players).forEach(([playerId, player]) => {
                    if (playerId !== bullet.playerId) {
                        const dx = player.x - bullet.x;
                        const dy = player.y - bullet.y;
                        if (Math.sqrt(dx * dx + dy * dy) < 20) {
                            socket.emit('playerHit', { hit: playerId, shooter: bullet.playerId });
                            bullets.splice(index, 1);
                        }
                    }
                });
            });
        };
        const gameLoop = () => {
            if(socket.id){
                focusOnPlayer(socket.id);
            }
            drawPlayers();
            drawBullets();
            updateBullets();
            requestAnimationFrame(gameLoop);
        };

        socket.on('currentPlayers', (playersData) => {
            players = playersData;
            console.log('Username set:', players[socket.id]);
        });

        socket.on('updatePlayer', (playerData) => {
            console.log('Updated player data:', playerData);
        });

        socket.on('usernameSet', (playerData) => {
            players[socket.id] = playerData;
            console.log('Username set:', players[socket.id]); // For debugging
          });

        socket.on('gunMoved', ({ id, gun }) => {
            if (players[id]) {
                players[id].gun = gun;
            }
        });

        // socket.on('createGun', ({id}) => {
        //     let player = players[id];
        //     if (!player.hasGun) {
        //         players[id].hasGun = true;
        //         socket.emit('gunCreated', { hasGun: true });
        //     }
        // });

        socket.on('newPlayer', (playerData) => {
            players[playerData.id] = playerData;
        });

        socket.on('playerDisconnected', (playerId) => {
            delete players[playerId];
        });

        socket.on('playerMoved', (playerData) => {
            players[playerData.id] = playerData;
        });

        socket.on('bulletFired', (bulletData) => {
            bullets.push(bulletData);
        });

        socket.on('scoreUpdate', ({ id, score, life, hit }) => {
            if (players[id]) {
                players[id].score = score;
                players[hit].life = life;
            }
        });

        gameLoop();

        // canvas.addEventListener('mousemove', (event) => {
        //     if (socket.id in players) {
        //         const rect = canvas.getBoundingClientRect();
        //         const x = event.clientX - rect.left;
        //         const y = event.clientY - rect.top;
        //         players[socket.id].x = x;
        //         players[socket.id].y = y;
        //         socket.emit('playerMovement', { x, y });
        //     }
        // });

        canvas.addEventListener('mousemove', (event) => {
            if (socket.id in players) {
                const rect = canvas.getBoundingClientRect();
                mouseX = event.clientX - rect.left;
                mouseY = event.clientY - rect.top;
            }
        });

        const keys = {};

        window.addEventListener('keydown', (event) => {
            keys[event.key] = true;
            updatePlayerPosition();
        });

        window.addEventListener('keyup', (event) => {
            keys[event.key] = false;
            updatePlayerPosition();
        });

        const updatePlayerGun = () => {
            if (players[socket.id]) {
                const player = players[socket.id];
                const angle = Math.atan2(mouseY - player.y - 20, mouseX - player.x - 25);
                player.gun.x = player.x + 25;
                player.gun.y = player.y + 20;
                player.gun.angle = angle;
                socket.emit('gunMovement', { gun: player.gun });
            }
        };

        const updateViewport = () => {
            if (socket.id in players) {
                let player = players[socket.id];
                const playerBuffer = 100; // Buffer from the edge before scrolling

                // Calculate the viewport position to keep the player within a buffer zone
                if (player.x < viewport.x + playerBuffer) {
                    viewport.x = clamp(player.x - playerBuffer, 0, canvas.width - viewport.width);
                }
                if (player.x > viewport.x + viewport.width - playerBuffer) {
                    viewport.x = clamp(player.x - viewport.width + playerBuffer, 0, canvas.width - viewport.width);
                }
                if (player.y < viewport.y + playerBuffer) {
                    viewport.y = clamp(player.y - playerBuffer, 0, canvas.height - viewport.height);
                }
                if (player.y > viewport.y + viewport.height - playerBuffer) {
                    viewport.y = clamp(player.y - viewport.height + playerBuffer, 0, canvas.height - viewport.height);
                }

                // Scroll the canvas by adjusting the canvas position
                // Note: Adjust this according to how your canvas is rendered
                canvas.style.transform = `translate(-${viewport.x}px, -${viewport.y}px)`;
            }
        };

        function updatePlayerPosition() {
            if (socket.id in players) {

                let player = players[socket.id];
                const speed = 15; // Set the player's movement speed
                
                

                if (keys['w'] || keys['ArrowUp']) {
                    for (const obj of objects) {
                        if (isColliding(player.x, player.y - speed, obj, player)) {
                            return;
                        }
                    }
                    player.y -= speed;
                    player.direction = 'up';
                }
                if (keys['a'] || keys['ArrowLeft']) {
                    for (const obj of objects) {
                        if (isColliding(player.x - speed, player.y, obj, player)) {
                            return;
                        }
                    }
                    player.x -= speed;
                    player.direction = 'left';
                }
                if (keys['s'] || keys['ArrowDown']) {
                    for (const obj of objects) {
                        if (isColliding(player.x, player.y + speed, obj, player)) {
                            return;
                        }
                    }
                    player.y += speed;
                    player.direction = 'down';
                }
                if (keys['d'] || keys['ArrowRight']) {
                    for (const obj of objects) {
                        if (isColliding(player.x + speed, player.y, obj, player)) {
                            return;
                        }
                    }
                    player.x += speed;
                    player.direction = 'right';
                }

                

                player.x = clamp(player.x, 0, 2000 - 100);
                player.y = clamp(player.y, 0, 2000 - 100);

                socket.emit('playerMovement', { x: player.x, y: player.y, direction: player.direction });

                updateViewport();
            }
        }

        canvas.addEventListener('click', (event) => {
            if (socket.id in players) {
                const speed = 15; // Set the player's bullet speed
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const angle = Math.atan2(y - players[socket.id].y, x - players[socket.id].x);
                const bulletData = {
                    x: players[socket.id].x,
                    y: players[socket.id].y,
                    dx: Math.cos(angle) * speed,
                    dy: Math.sin(angle) * speed,
                    playerId: socket.id
                };

                socket.emit('shoot', bulletData);
            }
        });