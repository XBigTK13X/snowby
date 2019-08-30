package com.simplepathstudios.snowby.util;

import org.videolan.vlc.R;
import org.videolan.vlc.VLCApplication;

public class SnowbySettings {
    public static final String EMBY_SERVER_ADDRESS = "http://9914.us:8096";
    public static final long NO_POSITION_SET = -1;
    private static long resumePositionMilliseconds = NO_POSITION_SET;

    public static long getResumePositionMilliseconds(){
        long result = resumePositionMilliseconds;
        resumePositionMilliseconds = NO_POSITION_SET;
        return result;
    }

    public static void setResumePositionMilliseconds(long position){
        resumePositionMilliseconds = position;
    }

    public static int getLibraryCardWidth(){
        return VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_library_card_width);
    }

    public static int getLibraryCardHeight(){
        return VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_library_card_height);
    }

    public static int getHomeCardWidth(){
        return VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_home_card_width);
    }

    public static int getHomeCardHeight(){
        return VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_home_card_height);
    }
}
