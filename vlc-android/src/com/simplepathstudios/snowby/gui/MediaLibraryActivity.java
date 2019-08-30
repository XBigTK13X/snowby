package com.simplepathstudios.snowby.gui;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;

import org.videolan.vlc.R;

public class MediaLibraryActivity extends Activity {
    public static final String SHARED_ELEMENT_NAME = "hero";
    public static final String PARENT_ID = "library_item_parent_id";

    private MediaLibraryFragment fragment;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_media_library);
        fragment = (MediaLibraryFragment) getFragmentManager().findFragmentById(R.id.media_library_fragment);
    }

    public void filterMedia(View v){
        fragment.filterMedia(v);
    }

    public void sortMedia(View v){
        fragment.sortMedia(v);
    }
}
