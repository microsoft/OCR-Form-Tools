import { useEffect } from 'react';

const useEscape = (onEscape) => {
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.keyCode === 27) {
                onEscape();
            }
        };
        window.addEventListener('keydown', handleEscape);

        return () => window.removeEventListener('keydown', handleEscape);
    }, []);
}

export default useEscape
