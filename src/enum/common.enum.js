export const Environment = {
    dev: 'development',
    prod: 'production',
    test: 'test',
};

export const Message = {
    otpExpired: "OTP expired, Please request another OTP.",
    incorrectOtp: "OTP not verified",
    phoneOrOtpIncorrect: "Phone or OTP is incorrect",
    invalidReferralCode: "Please Enter valid referral code",
};

export const WorkingStatus = {
    active: 'active',
    inactive: 'inactive',
    blocked: 'blocked'
};

export const PostReaction = {
    love: 'love',
    angry: 'angry',
    enjoy: 'enjoy',
    lol: 'lol',
    wow: 'wow',
    sad: 'sad',
};

export const PostVoteOption = {
    voteUp: 'vote_up',
    voteDown: 'vote_down',
    noVote: 'no_vote',
};

export const AgeRange = {
    1: {"min": 18, "max": 24},
    2: {"min": 25, "max": 34},
    3: {"min": 35, "max": 40},
    4: {"min": 41, "max": null}
};

export const ProfileType = {
    personal: 'personal',
    business: 'business',
    anonymous: 'anonymous'
};

export const PostType = {
    normal: 'normal',
    sellingAroundMe: 'selling_around_me',
    offersAroundMe: 'offers_around_me',
};

export const LanguageCode = {
    English: 'en',
    Hindi: 'hi',
    Sambalpuri: 'ta',
    Odia: 'or',
}
