package com.simplepathstudios.snowby.gui;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;

import org.videolan.vlc.R;

public class MediaLibraryActivity extends Activity {
    public static final String PARENT_ID = "library_item_parent_id";
    public static final String LIBRARY_TYPE = "library_item_type";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_media_library);
    }
}
