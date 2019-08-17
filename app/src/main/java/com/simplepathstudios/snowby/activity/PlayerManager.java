package com.simplepathstudios.snowby.activity;

import android.content.Context;
import android.util.Log;

import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.ui.PlayerView;


public class PlayerManager {

    private static final String TAG = "PlayerManager";

    private SimpleExoPlayer player;
    private long contentPosition;
    private MediaSource mediaSource;

    public PlayerManager(MediaSource source) {
       mediaSource = source;

    }

    public void init(Context context, PlayerView playerView) {
        // Create a player instance.
        player = ExoPlayerFactory.newSimpleInstance(context);
        player.addListener(new Player.EventListener(){
            @Override
            public void onPlayerStateChanged(boolean playWhenReady, int playbackState) {
                if(playbackState == Player.STATE_BUFFERING){
                    Log.d(TAG,"The exoplayer changed states to BUFFERING - "+playWhenReady);
                }
                else if(playbackState == Player.STATE_ENDED){
                    Log.d(TAG,"The exoplayer changed states to ENDED");
                }
                else if(playbackState == Player.STATE_IDLE){
                    Log.d(TAG,"The exoplayer changed states to IDLE");
                }
                else if(playbackState == Player.STATE_READY){
                    Log.d(TAG,"The exoplayer changed states to STATE_READY");
                }
                else{
                    Log.d(TAG,"The exoplayer changed to an unknown state"+playbackState);
                }
            }
            public void onPlayerError(ExoPlaybackException error) {
                Log.e(TAG,"An exoplayer error occurred",error);
            }
        });
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
