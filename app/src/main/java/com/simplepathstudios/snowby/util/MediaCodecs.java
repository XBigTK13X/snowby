package com.simplepathstudios.snowby.util;

import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.util.Log;

import java.util.Arrays;

public class MediaCodecs {
    private static final String TAG = "MediaCodecs";
    public static void listAvailable(){
        MediaCodecList codecs = new MediaCodecList(MediaCodecList.REGULAR_CODECS);
        for(MediaCodecInfo info: codecs.getCodecInfos()){
            Log.d(TAG,"Found media codec: "+info.getName());
            Log.d(TAG,"Supported Types: "+ Arrays.toString(info.getSupportedTypes()));
            Log.d(TAG,"Is encoder: "+info.isEncoder());
        }
    }
}
