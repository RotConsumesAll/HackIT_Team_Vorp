"use client";

import { useEffect, useState } from "react";

export const SET_SIZE = 20;
const API_URL = "https://chinese-proverbs.onrender.com/api/proverbs/all";

// Split the full list into sets of 20: [[...20], [...20], ...]
export function chunk(list, size = SET_SIZE) {
    const sets = [];
    for (let i = 0; i < list.length; i += size) {
        sets.push(list.slice(i, i + size));
    }
    return sets;
}

export function useProverbs() {
    const [proverbs, setProverbs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(API_URL)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setProverbs(Array.isArray(data) ? data : data.proverbs ?? []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return { proverbs, loading, error };
}

export function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}