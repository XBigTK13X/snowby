package com.simplepathstudios.snowby.util;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;

import org.videolan.vlc.R;
import org.videolan.vlc.VLCApplication;

public class SnowbySettings {
    public static final String EMBY_SERVER_ADDRESS = "http://9914.us:8096";
    public static final long NO_POSITION_SET = -1;
    public static final String DEFAULT_FILTERS = "";
    public static final String DEFAULT_SORT = "SortName";

    private static long resumePositionMilliseconds = NO_POSITION_SET;

    public static long getResumePositionMilliseconds(){
        long result = resumePositionMilliseconds;
        resumePositionMilliseconds = NO_POSITION_SET;
        return result;
    }

    public static void setResumePositionMilliseconds(long position){
        resumePositionMilliseconds = position;
    }

    public static int getLibraryCardWidth(boolean isSeason){
        return isSeason ? getResumeCardWidth() : VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_library_card_width);
    }

    public static int getLibraryCardHeight(boolean isSeason){
        return isSeason ? getResumeCardHeight() : VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_library_card_height);
    }

    public static int getHomeCardWidth(){
        return VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_home_card_width);
    }

    public static int getHomeCardHeight(){
        return VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_home_card_height);
    }

    public static int getResumeCardWidth(){
        return VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_resume_card_width);
    }

    public static int getResumeCardHeight(){
        return VLCApplication.Companion.getAppResources().getDimensionPixelSize(R.dimen.snowby_resume_card_height);
    }

    public static int getLibraryColumns(boolean isSeason){
        return isSeason ? 3: 5;
    }

    public static void setFilters(Context context, String filtersCsv){
        SharedPreferences prefs = context.getSharedPreferences("SNOWBY_SETTINGS",Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("SNOWBY_MEDIA_LIBRARY_FILTERS", filtersCsv);
        editor.commit();
    }

    public static String getFilters(Context context){
        SharedPreferences prefs = context.getSharedPreferences("SNOWBY_SETTINGS",Context.MODE_PRIVATE);
        String result = prefs.getString("SNOWBY_MEDIA_LIBRARY_FILTERS", null);
        if(result == null){
            return DEFAULT_FILTERS;
        }
        return result;
    }

    public static void setSort(Context context, String sortCsv){
        SharedPreferences prefs = context.getSharedPreferences("SNOWBY_SETTINGS",Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("SNOWBY_MEDIA_LIBRARY_SORT", sortCsv);
        editor.commit();
    }

    public static String getSort(Context context){
        SharedPreferences prefs = context.getSharedPreferences("SNOWBY_SETTINGS",Context.MODE_PRIVATE);
        String result = prefs.getString("SNOWBY_MEDIA_LIBRARY_SORT", null);
        if(result == null){
            return DEFAULT_SORT;
        }
        return result;
    }

}
