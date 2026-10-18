"use client";

import { useEffect, useState } from "react";

export const SET_SIZE = 20;
const API_URL = "/api/proverbs"; // now points at your own route

let cache = null;    // survives page-to-page navigation until a hard refresh
let inflight = null; // if two components ask at once, they share one request

function loadProverbs() {
    if (cache) return Promise.resolve(cache);

    if (!inflight) {
        inflight = fetch(API_URL)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                cache = Array.isArray(data) ? data : data.proverbs ?? [];
                return cache;
            })
            .finally(() => {
                inflight = null;
            });
    }
    return inflight;
}

export function chunk(list, size = SET_SIZE) {
    const sets = [];
    for (let i = 0; i < list.length; i += size) {
        sets.push(list.slice(i, i + size));
    }
    return sets;
}

export function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function useProverbs() {
    const [proverbs, setProverbs] = useState(cache ?? []);
    const [loading, setLoading] = useState(!cache);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (cache) return; // already have it, nothing to do

        loadProverbs()
            .then(setProverbs)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return { proverbs, loading, error };
}