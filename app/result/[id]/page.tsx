"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

interface VideoOverlays {
    discount: string | null;
    urgency: string | null;
    productName: string;
    price: string;
}

interface VideoResult {
    id: string;
    videoUrl: string;
    caption: string;
    hashtags: string[];
    productTitle: string;
    overlays?: VideoOverlays;
}

export default function ResultPage() {
    const params = useParams();
    const [result, setResult] = useState<VideoResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showOverlays, setShowOverlays] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const response = await fetch(`/api/result/${params.id}`);
                if (!response.ok) {
                    throw new Error("Video not found");
                }
                const data = await response.json();
                setResult(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load video");
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [params.id]);

    const copyCaption = () => {
        if (result) {
            const fullText = `${result.caption}\n\n${result.hashtags.join(" ")}`;
            navigator.clipboard.writeText(fullText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadVideo = () => {
        if (result) {
            const link = document.createElement("a");
            link.href = result.videoUrl;
            link.download = `${result.productTitle.replace(/\s+/g, "_")}_video.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading your video...</p>
                </div>
            </main>
        );
    }

    if (error || !result) {
        return (
            <main className={styles.main}>
                <div className={styles.errorContainer}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h2>Video Not Found</h2>
                    <p>{error || "The video you're looking for doesn't exist."}</p>
                    <Link href="/create" className="btn btn-primary">
                        Create New Video
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                </Link>
                <h1>Your Video is Ready!</h1>
            </div>

            <div className={styles.content}>
                {/* Video Preview - text overlays are burned into the video */}
                <div className={styles.videoContainer}>
                    <video
                        src={result.videoUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className={styles.video}
                    />
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button onClick={downloadVideo} className="btn btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download Video
                    </button>
                    <Link href="/create" className="btn btn-secondary">
                        Create Another
                    </Link>
                </div>

                {/* Caption */}
                <div className={styles.captionCard}>
                    <div className={styles.captionHeader}>
                        <h3>Caption & Hashtags</h3>
                        <button onClick={copyCaption} className={styles.copyBtn}>
                            {copied ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <p className={styles.captionText}>{result.caption}</p>
                    <div className={styles.hashtags}>
                        {result.hashtags.map((tag, i) => (
                            <span key={i} className={styles.hashtag}>{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
