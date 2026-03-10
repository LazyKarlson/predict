import { Match, Prediction } from '../types';

/**
 * Рассчитывает баллы за прогноз
 * 
 * Правила:
 * - Угадал победителя: +1 балл
 * - Угадал точный счет: +2 балла (дополнительно)
 * - Угадал дополнительное время: +0.5 балла
 * - Угадал пенальти: +0.5 балла
 */
export function calculatePoints(match: Match, prediction: Prediction): number {
    if (!match.is_finished) {
        return 0;
    }
    
    let points = 0;
    
    const actualTeam1Score = match.team1_score!;
    const actualTeam2Score = match.team2_score!;
    const predictedTeam1Score = prediction.predicted_team1_score;
    const predictedTeam2Score = prediction.predicted_team2_score;
    
    // Определяем победителя в основное время
    const actualWinner = actualTeam1Score > actualTeam2Score ? 1 : 
                        actualTeam2Score > actualTeam1Score ? 2 : 0;
    const predictedWinner = predictedTeam1Score > predictedTeam2Score ? 1 :
                           predictedTeam2Score > predictedTeam1Score ? 2 : 0;
    
    // Проверка угаданного победителя
    if (actualWinner !== 0 && actualWinner === predictedWinner) {
        points += 1;
    }
    
    // Проверка точного счета
    if (actualTeam1Score === predictedTeam1Score && 
        actualTeam2Score === predictedTeam2Score) {
        points += 2;
    }
    
    // Проверка дополнительного времени
    if (match.had_extra_time === prediction.predicted_extra_time) {
        points += 0.5;
    }

    // Проверка пенальти
    if (match.had_penalties === prediction.predicted_penalties) {
        points += 0.5;
    }
    
    return points;
}

