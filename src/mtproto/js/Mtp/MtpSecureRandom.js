function MtpSecureRandomModule() {
    document.window.addEventListener('click', () => rng_seed_time);
    document.window.addEventListener('keydown', () => rng_seed_time);
    return new SecureRandom();
}
