export function createScoreCard() {
  // Create score element
  const scoreElement = document.createElement('div');
  scoreElement.id = 'score-card';
  scoreElement.style.position = 'absolute';
  scoreElement.style.bottom = '20px';
  scoreElement.style.left = '20px';
  scoreElement.style.padding = '10px 20px';
  scoreElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  scoreElement.style.color = 'white';
  scoreElement.style.borderRadius = '5px';
  scoreElement.style.fontFamily = 'Arial, sans-serif';
  scoreElement.style.fontSize = '18px';
  scoreElement.style.fontWeight = 'bold';
  scoreElement.style.zIndex = '1000';

  // Add to DOM
  document.body.appendChild(scoreElement);

  // Update function
  const updateScore = (popped: number, total: number) => {
    scoreElement.textContent = `Balloons 🎈: ${popped}/${total}`;
  };

  // Initial update
  updateScore(0, 0);

  return {
    updateScore
  };
}
