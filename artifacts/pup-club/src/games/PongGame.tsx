import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useSubmitScore, useGetPatron } from '@workspace/api-client-react';
import { getGetPatronQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { activeGame, setActiveGame, venue, patron, addPendingReward, setActiveTab } = useStore();
  const [gameOver, setGameOver] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const submitScoreMutation = useSubmitScore();
  const queryClient = useQueryClient();

  const gameLoopRef = useRef<number>();
  const scoreRef = useRef({ player: 0, ai: 0 });
  const timeRef = useRef(0);

  // Constants
  const WIN_SCORE = 7;
  const PADDLE_HEIGHT = 10;
  const PADDLE_WIDTH = 80;
  const BALL_SIZE = 8;
  const BASE_SPEED = 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: BASE_SPEED, dy: BASE_SPEED, speed: BASE_SPEED };
    let playerPaddle = { x: canvas.width / 2 - PADDLE_WIDTH / 2, y: canvas.height - 40, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    let aiPaddle = { x: canvas.width / 2 - PADDLE_WIDTH / 2, y: 30, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };

    scoreRef.current = { player: 0, ai: 0 };
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    timeRef.current = Date.now();

    const resetBall = () => {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.speed = BASE_SPEED;
      ball.dx = (Math.random() > 0.5 ? 1 : -1) * BASE_SPEED;
      ball.dy = (Math.random() > 0.5 ? 1 : -1) * BASE_SPEED;
    };

    const update = () => {
      if (scoreRef.current.player >= WIN_SCORE || scoreRef.current.ai >= WIN_SCORE) {
        setGameOver(true);
        return;
      }
      
      const maxDuration = activeGame?.max_duration || 120;
      if ((Date.now() - timeRef.current) / 1000 > maxDuration) {
         setGameOver(true);
         return;
      }

      // AI movement (simple tracking)
      const aiCenter = aiPaddle.x + aiPaddle.width / 2;
      if (aiCenter < ball.x - 10) {
        aiPaddle.x += BASE_SPEED * 0.8;
      } else if (aiCenter > ball.x + 10) {
        aiPaddle.x -= BASE_SPEED * 0.8;
      }
      aiPaddle.x = Math.max(0, Math.min(canvas.width - aiPaddle.width, aiPaddle.x));

      // Ball movement
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Wall collision
      if (ball.x <= 0 || ball.x + BALL_SIZE >= canvas.width) {
        ball.dx *= -1;
      }

      // Scoring
      if (ball.y <= 0) {
        scoreRef.current.player++;
        setPlayerScore(scoreRef.current.player);
        resetBall();
      } else if (ball.y + BALL_SIZE >= canvas.height) {
        scoreRef.current.ai++;
        setAiScore(scoreRef.current.ai);
        resetBall();
      }

      // Paddle collision
      const checkCollision = (paddle: any) => {
        return (
          ball.x < paddle.x + paddle.width &&
          ball.x + BALL_SIZE > paddle.x &&
          ball.y < paddle.y + paddle.height &&
          ball.y + BALL_SIZE > paddle.y
        );
      };

      if (checkCollision(playerPaddle)) {
        ball.dy *= -1;
        ball.y = playerPaddle.y - BALL_SIZE; // Push out
        ball.speed += 0.2;
        // Add english
        const hitPoint = (ball.x - (playerPaddle.x + playerPaddle.width / 2)) / (playerPaddle.width / 2);
        ball.dx = hitPoint * ball.speed;
        ball.dy = -Math.sqrt(ball.speed * ball.speed - ball.dx * ball.dx);
      } else if (checkCollision(aiPaddle)) {
        ball.dy *= -1;
        ball.y = aiPaddle.y + aiPaddle.height;
        ball.speed += 0.2;
      }

      draw();
      gameLoopRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
      // Clear
      ctx.fillStyle = '#0D0D1A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center line
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.strokeStyle = '#252540';
      ctx.stroke();

      // Draw Paddles
      ctx.shadowBlur = 10;
      
      // AI Paddle (Cyan)
      ctx.shadowColor = '#00E5FF';
      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(aiPaddle.x, aiPaddle.y, aiPaddle.width, aiPaddle.height);
      
      // Player Paddle (Pink)
      ctx.shadowColor = '#FF2D78';
      ctx.fillStyle = '#FF2D78';
      ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);

      // Draw Ball (Green)
      ctx.shadowColor = '#39FF14';
      ctx.fillStyle = '#39FF14';
      ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);
      
      ctx.shadowBlur = 0;
    };

    // Input handlers
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      playerPaddle.x = touch.clientX - playerPaddle.width / 2;
      playerPaddle.x = Math.max(0, Math.min(canvas.width - playerPaddle.width, playerPaddle.x));
    };

    const handleMouse = (e: MouseEvent) => {
      playerPaddle.x = e.clientX - playerPaddle.width / 2;
      playerPaddle.x = Math.max(0, Math.min(canvas.width - playerPaddle.width, playerPaddle.x));
    };

    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('mousemove', handleMouse);

    // Start
    update();

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      canvas.removeEventListener('touchmove', handleTouch);
      canvas.removeEventListener('mousemove', handleMouse);
    };
  }, [activeGame]);

  const handleExit = () => {
    setActiveGame(null);
  };

  const handleSubmit = () => {
    if (!activeGame || !venue || !patron) return;

    // Simple score calc: player score * 10
    const finalScore = scoreRef.current.player * 10;
    const duration = Math.floor((Date.now() - timeRef.current) / 1000);

    submitScoreMutation.mutate(
      {
        data: {
          game_id: activeGame.id,
          patron_id: patron.id,
          venue_id: venue.id,
          score: finalScore,
          duration_secs: duration,
        }
      },
      {
        onSuccess: (scoreRecord) => {
          // Add reward toast
          const xpEarned = finalScore; // 1 XP per point
          addPendingReward({
            xp: xpEarned,
            message: `Score submitted for ${activeGame.name}`,
          });
          
          // Invalidate patron to get new XP
          queryClient.invalidateQueries({ queryKey: getGetPatronQueryKey({ session_token: patron.session_token }) });
          
          setActiveGame(null);
          setActiveTab('leaderboard');
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D1A] overflow-hidden">
      <button 
        onClick={handleExit}
        className="absolute top-6 left-4 text-white text-2xl z-10 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full border border-[#252540]"
      >
        ✕
      </button>

      <div className="absolute top-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-[#252540] flex items-center gap-6">
          <div className="text-[#00E5FF] font-mono text-xl neon-text-secondary">{aiScore}</div>
          <div className="text-gray-500 font-mono text-sm">VS</div>
          <div className="text-[#FF2D78] font-mono text-xl neon-text-primary">{playerScore}</div>
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        className="block w-full h-full touch-none"
      />

      {gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-20">
          <div className="bg-[#1A1A2E] border-2 border-[#FF2D78] rounded-xl p-8 max-w-sm w-full text-center neon-border-primary">
            <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-widest">Game Over</h2>
            <div className="text-6xl font-mono text-[#39FF14] font-bold mb-6 neon-text-green">
              {scoreRef.current.player * 10}
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={submitScoreMutation.isPending}
              className="w-full bg-[#FF2D78] text-white font-bold py-4 rounded-lg uppercase tracking-wider disabled:opacity-50 hover:bg-opacity-90 active:bg-opacity-80 transition-opacity mb-3"
            >
              {submitScoreMutation.isPending ? 'Submitting...' : 'Submit Score'}
            </button>
            
            <button 
              onClick={handleExit}
              disabled={submitScoreMutation.isPending}
              className="w-full bg-transparent border border-[#252540] text-gray-400 font-bold py-3 rounded-lg uppercase tracking-wider hover:bg-[#252540]/50 transition-colors"
            >
              Discard & Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
