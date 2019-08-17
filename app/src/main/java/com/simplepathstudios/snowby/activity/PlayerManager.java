package com.simplepathstudios.snowby.activity;

import android.content.Context;
import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.ui.PlayerView;


public class PlayerManager {

    private SimpleExoPlayer player;
    private long contentPosition;
    private MediaSource mediaSource;

    public PlayerManager(MediaSource source) {
       mediaSource = source;

    }

    public void init(Context context, PlayerView playerView) {
        // Create a player instance.
        player = ExoPlayerFactory.newSimpleInstance(context);
        playerView.setPlayer(player);

        // Prepare the player with the source.
        player.seekTo(contentPosition);
        player.prepare(mediaSource);
        player.setPlayWhenReady(true);
    }

    public void reset() {
        if (player != null) {
            contentPosition = player.getContentPosition();
            player.release();
            player = null;
        }
    }

    public void release() {
        if (player != null) {
            player.release();
            player = null;
        }
    }
}
