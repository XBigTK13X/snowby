package com.simplepathstudios.snowby.activity;

import android.app.Activity;
import android.os.Bundle;

import com.simplepathstudios.snowby.R;

public class MediaLibraryActivity extends Activity {
    public static final String SHARED_ELEMENT_NAME = "hero";
    public static final String PARENT_ID = "library_item_parent_id";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_media_library);
    }
}
