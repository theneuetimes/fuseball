import p5 from "q5";
import type { StateType } from "../state-machine";
import PLAYER from "../const/player";
import lerp from "../helpers/lerp";
import LOBBY_STATUS from "@/lib/const/lobby-status";
import TEAM_COLORS from "@/lib/const/team-colors";
import META from "@/lib/const/meta";
import renderSeparation from "../helpers/render-separation";
import { LobbyPlayerLive } from "@/context/game.context";
import secondsToMinutesAndSeconds from "@/lib/helpers/seconds-to-minutes";
import MAP from "../const/map";
import GAME from "../const/game";
import TEAM_NAMES from "@/lib/const/team-names";
import playerController from "../player-controller";
import { PositionType } from "@/context/game.context";

const userInterfaceRenderer = (p: p5, state: StateType) => {
  const debugLines = [
    `FPS: ${Number(p.frameRate()).toFixed(0)}`,
    `Ping: ${state.ping}ms`,
    `Player position: ${state.followingPlayer?.position.x.toFixed(
      0
    )}, ${state.followingPlayer?.position.y.toFixed(0)}`,
  ];

  const drawNametag = (player: LobbyPlayerLive) => {
    p.push();

    // todo: move this into a helper function and reuse in drawNametags/drawspeechbubble
    const lerpedPosition = {
      x: lerp(
        player.previousPosition?.x ?? 0,
        player.targetPosition?.x ?? 0,
        PLAYER.LERP_AMT
      ),
      y: lerp(
        player.previousPosition?.y ?? 0,
        player.targetPosition?.y ?? 0,
        PLAYER.LERP_AMT
      ),
    };

    p.translate(
      lerpedPosition.x,
      lerpedPosition.y - PLAYER.SIZE / 2 - PLAYER.NAMETAG_GAP
    );

    p.fill(TEAM_COLORS[player.team] ?? TEAM_COLORS[0]);
    p.stroke(51);
    p.strokeWeight(4);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);

    p.text(player.name, 0, 0);

    p.pop();
  };

  const drawNametags = () => {
    state.currentLobbyLive?.players.forEach(drawNametag);
  };

  const drawDebugInfo = () => {
    debugLines.reverse().forEach((line, index) => {
      p.text(line, 20, p.height - 20 - index * 20);
    });
  };

  const drawSpeechBubble = (player: LobbyPlayerLive, text: string) => {
    p.push();
    p.textSize(16);

    const bubbleWidth = p.textWidth(text) + 40;
    const bubbleHeight = 60;

    // todo: move this into a helper function and reuse in drawNametags/drawspeechbubble
    const lerpedPosition = {
      x: lerp(
        player.previousPosition?.x ?? 0,
        player.targetPosition?.x ?? 0,
        PLAYER.LERP_AMT
      ),
      y: lerp(
        player.previousPosition?.y ?? 0,
        player.targetPosition?.y ?? 0,
        PLAYER.LERP_AMT
      ),
    };

    p.translate(
      lerpedPosition.x -
        PLAYER.SIZE / 2 -
        PLAYER.BUBBLE_POINTER_OFFSET / 2 +
        PLAYER.BUBBLE_POINTER_SIZE / 2,
      lerpedPosition.y -
        PLAYER.SIZE / 2 -
        bubbleHeight -
        PLAYER.BUBBLE_POINTER_SIZE -
        PLAYER.NAMETAG_GAP -
        12
    );

    p.beginShape();
    p.stroke(51);
    p.strokeWeight(4);
    p.fill(255);

    // Top left corner
    p.vertex(PLAYER.BUBBLE_CORNER_RADIUS, 0);
    p.quadraticVertex(0, 0, 0, PLAYER.BUBBLE_CORNER_RADIUS);

    // Bottom left corner
    p.vertex(0, bubbleHeight - PLAYER.BUBBLE_CORNER_RADIUS);
    p.quadraticVertex(
      0,
      bubbleHeight,
      PLAYER.BUBBLE_CORNER_RADIUS,
      bubbleHeight
    );

    // Pointer bottom left
    p.vertex(
      PLAYER.BUBBLE_POINTER_OFFSET - PLAYER.BUBBLE_POINTER_SIZE,
      bubbleHeight
    );

    // Pointer tip
    p.vertex(
      PLAYER.BUBBLE_POINTER_OFFSET,
      bubbleHeight + PLAYER.BUBBLE_POINTER_SIZE
    );

    // Pointer bottom right
    p.vertex(
      PLAYER.BUBBLE_POINTER_OFFSET + PLAYER.BUBBLE_POINTER_SIZE,
      bubbleHeight
    );

    // Bottom right corner
    p.vertex(bubbleWidth - PLAYER.BUBBLE_CORNER_RADIUS, bubbleHeight);
    p.quadraticVertex(
      bubbleWidth,
      bubbleHeight,
      bubbleWidth,
      bubbleHeight - PLAYER.BUBBLE_CORNER_RADIUS
    );

    // Top right corner
    p.vertex(bubbleWidth, PLAYER.BUBBLE_CORNER_RADIUS);
    p.quadraticVertex(
      bubbleWidth,
      0,
      bubbleWidth - PLAYER.BUBBLE_CORNER_RADIUS,
      0
    );

    p.vertex(PLAYER.BUBBLE_CORNER_RADIUS, 0);
    p.endShape(p.CLOSE);

    p.translate(bubbleWidth / 2, bubbleHeight / 2);
    p.textAlign(p.CENTER, p.CENTER);

    p.text(text, 0, 0);

    p.pop();
  };

  const drawChatMessages = () => {
    if (!state.currentLobbyLive) return;

    Object.keys(state.currentLobbyLive.chatMessages).forEach((playerId) => {
      const message = state.currentLobbyLive?.chatMessages[Number(playerId)];

      if (!message) {
        return;
      }

      const player = state.currentLobbyLive?.players.find(
        (player) => player.id === Number(playerId)
      );

      if (!player) {
        return;
      }

      drawSpeechBubble(player, message.message);
    });
  };

  // const followPlayer = (player: LobbyPlayerLive) => {
  //   p.translate(
  //     p.width / 2 - player.position.x,
  //     p.height / 2 - player.position.y
  //   );
  // };

  const drawLobbyInfo = () => {
    if (!state.currentLobbyMeta) return;

    p.push();

    p.translate(0, state.isMobile ? -20 : -10);

    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.stroke(51);
    p.strokeWeight(4);
    p.text(state.currentLobbyMeta.name, p.width / 2, 40);

    if (!state.currentLobbyLive) return;

    const lobbyStatus = LOBBY_STATUS[state.currentLobbyLive.status];
    const lobbyNameTextWidth = p.textWidth(state.currentLobbyMeta.name);
    const lobbyStatusText = () => {
      if (state.currentLobbyLive?.status === "in-progress") {
        const { minutes, seconds } = secondsToMinutesAndSeconds(
          state.currentLobbyLive.timeLeft
        );

        return `${minutes}:${seconds}`;
      }

      return lobbyStatus.text;
    };

    p.textSize(24);
    p.fill(lobbyStatus.color);
    p.text(lobbyStatusText(), p.width / 2, 66);

    // scores
    p.fill(255);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);

    p.fill(TEAM_COLORS[0]);
    p.text(
      state.currentLobbyLive.score[0],
      p.width / 2 - lobbyNameTextWidth / 2 - 50,
      56
    );

    p.fill(TEAM_COLORS[1]);
    p.text(
      state.currentLobbyLive.score[1],
      p.width / 2 + lobbyNameTextWidth / 2 + 50,
      56
    );

    p.pop();
  };

  const drawLogo = () => {
    p.push();

    p.textSize(22);
    p.fill(255);
    p.stroke(51);
    p.strokeWeight(4);
    p.text(
      META.SITE_DOMAIN,
      p.width - p.textWidth(META.SITE_DOMAIN) - 20,
      p.height - 20
    );

    p.pop();
  };

  const drawRoundStarter = () => {
    if (state.currentLobbyLive?.roundStatus !== "protected") return;

    const timeLeft = Math.max(
      0,
      GAME.ROUND_START_TIMEOUT - state.currentLobbyLive.timeSinceRoundStart
    );

    p.textAlign(p.CENTER, p.CENTER);
    p.fill(TEAM_COLORS[state.currentLobbyLive?.startingTeam]);
    p.stroke(51);
    p.strokeWeight(4);
    p.textSize(18);
    p.text(
      `Team ${TEAM_NAMES[state.currentLobbyLive?.startingTeam]} is starting`,
      MAP.FIELD_WIDTH / 2,
      MAP.FIELD_HEIGHT / 2 - 70
    );
    p.textSize(26);
    p.fill(255);
    p.text(timeLeft, MAP.FIELD_WIDTH / 2, MAP.FIELD_HEIGHT / 2 - 40);
  };

  const drawMobileControls = () => {
    if (!state.isMobile || !state.isHorizontal) return;

    const joystickSize = 160;
    const paddingX = 50;
    const paddingY = 20;

    const centerX = paddingX + joystickSize / 2;
    const centerY = p.height - paddingY - joystickSize / 2;

    p.touchStarted = () => {
      handleTouch();
    };

    p.touchMoved = () => {
      handleTouch();
    };

    p.touchEnded = () => {
      // touchX = centerX;
      // touchY = centerY;
      state.touch = { x: centerX, y: centerY };

      playerController(state).stopAllMovements();
    };

    const handleTouch = () => {
      if (p.touches.length === 0) return;

      const touch = p.touches[0] as PositionType;
      const dx = touch.x - centerX;
      const dy = touch.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < joystickSize / 2) {
        // touchX = touch.x;
        // touchY = touch.y;
        state.touch = { x: touch.x, y: touch.y };
      } else {
        // touchX = centerX + (dx / distance) * (joystickSize / 2);
        // touchY = centerY + (dy / distance) * (joystickSize / 2);
        state.touch = {
          x: centerX + (dx / distance) * (joystickSize / 2),
          y: centerY + (dy / distance) * (joystickSize / 2),
        };
      }

      const tolerance = joystickSize * 0.1;

      // horizontal movements
      if (state.touch.x < centerX - tolerance) {
        playerController(state).move("start", "left");
        playerController(state).move("end", "right");
      } else if (state.touch.x > centerX + tolerance) {
        playerController(state).move("start", "right");
        playerController(state).move("end", "left");
      } else {
        playerController(state).move("end", "left");
        playerController(state).move("end", "right");
      }

      // vertical movements
      if (state.touch.y < centerY - tolerance) {
        playerController(state).move("start", "up");
        playerController(state).move("end", "down");
      } else if (state.touch.y > centerY + tolerance) {
        playerController(state).move("start", "down");
        playerController(state).move("end", "up");
      } else {
        playerController(state).move("end", "up");
        playerController(state).move("end", "down");
      }
    };

    const touchRender =
      state.touch.x === 0 && state.touch.y === 0
        ? {
            x: centerX,
            y: centerY,
          }
        : {
            x: state.touch.x,
            y: state.touch.y,
          };

    p.push();

    p.translate(centerX, centerY);
    p.noStroke();
    p.fill(255, 255, 255, 80);
    p.ellipse(0, 0, joystickSize); // outer circle

    p.fill(255, 255, 255);
    p.stroke(100);
    p.strokeWeight(4);
    p.ellipse(
      touchRender.x - centerX,
      touchRender.y - centerY,
      joystickSize * 0.4
    ); // inner circle

    p.pop();
  };

  const draw = () => {
    p.textFont("Itim");

    // moving elements based on players position
    renderSeparation(() => {
      p.translate(p.width / 2, p.height / 2);
      p.scale(state.cameraScale);
      p.translate(-state.cameraPosition.x, -state.cameraPosition.y);

      drawRoundStarter();
      drawNametags();
      drawChatMessages();
    }, p);

    // fixed elements
    renderSeparation(() => {
      drawLogo();
      drawDebugInfo();
      drawLobbyInfo();
      drawMobileControls();
    }, p);
  };

  return { draw, drawSpeechBubble };
};

export default userInterfaceRenderer;
