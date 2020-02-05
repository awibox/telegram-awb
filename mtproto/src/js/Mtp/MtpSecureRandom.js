function MtpSecureRandomModule() {
    window.addEventListener('click', rng_seed_time);
    window.addEventListener('keydown', rng_seed_time);
    return new SecureRandom();
}

MtpSecureRandomModule.dependencies = [
];
