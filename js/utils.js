export function random(max, min) {
    return Math.random() * (max - min) + min;
};

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
};

export function weightedChoice(options) {
    const total = options.reduce((sum, option) => sum + option.weight, 0);
    let r = Math.random() * total;

    for (const option of options) {
        r -= option.weight;
        if (r <= 0) return option.value;
    };

    return options[options.length - 1].value;
};