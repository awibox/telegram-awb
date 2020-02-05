import { SecureRandom, default as JSBn } from 'jsbn';

export default function MtpSecureRandomModule() {
    window.addEventListener('click', JSBn.rng_seed_time );
    window.addEventListener('keydown', JSBn.rng_seed_time);
    return new SecureRandom();
}
