export interface User {
    id: number;
    orbitar_id: string;
    username: string;
    display_name?: string;
    created_at: Date;
}

export interface Team {
    id: number;
    name: string;
    country_code: string;
    flag_emoji?: string;
    created_at: Date;
}

export interface Match {
    id: number;
    team1_id: number;
    team2_id: number;
    match_date: Date;
    stage: 'round_of_16' | 'quarterfinal' | 'semifinal' | 'final';
    team1_score?: number;
    team2_score?: number;
    had_extra_time: boolean;
    had_penalties: boolean;
    is_finished: boolean;
    created_at: Date;
}

export interface Prediction {
    id: number;
    user_id: number;
    match_id: number;
    predicted_team1_score: number;
    predicted_team2_score: number;
    predicted_extra_time: boolean;
    predicted_penalties: boolean;
    points_earned: number;
    created_at: Date;
    updated_at: Date;
}

export interface MatchWithTeams extends Match {
    team1_name: string;
    team1_flag?: string;
    team2_name: string;
    team2_flag?: string;
}

export interface LeaderboardEntry {
    user_id: number;
    username: string;
    display_name?: string;
    total_points: number;
    predictions_count: number;
}

declare module 'express-session' {
    interface SessionData {
        userId?: number;
        isAdmin?: boolean;
        oauthState?: string;
        oauthNonce?: string;
    }
}

