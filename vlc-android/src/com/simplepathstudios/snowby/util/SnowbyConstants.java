package com.simplepathstudios.snowby.util;

public class SnowbyConstants {
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
}
