package com.simplepathstudios.snowby.gui;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.CheckBox;
import android.widget.EditText;

import com.simplepathstudios.snowby.util.SnowbySettings;

import org.videolan.vlc.R;

public class SnowbySettingsActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_snowby_settings);
        CheckBox filterCheckbox = findViewById(R.id.checkbox_snowby_filter_enabled);
        String filters = SnowbySettings.getFilters(this);
        if(!filters.equals(SnowbySettings.DEFAULT_FILTERS)){
            filterCheckbox.setChecked(true);
            EditText optionCsv = findViewById(R.id.filterOptionsCsv);
            optionCsv.setText(filters);
        }
        CheckBox sortCheckbox = findViewById(R.id.checkbox_snowby_sort_enabled);
        String sort = SnowbySettings.getSort(this);
        if(!sort.equals(SnowbySettings.DEFAULT_SORT)){
            sortCheckbox.setChecked(true);
            EditText optionCsv = findViewById(R.id.sortOptionsCsv);
            optionCsv.setText(sort);
        }
    }

    public void onCheckboxClicked(View view) {
        boolean checked = ((CheckBox) view).isChecked();

        switch(view.getId()) {
            case R.id.checkbox_snowby_filter_enabled:
                if (checked){
                    EditText optionCsv = findViewById(R.id.filterOptionsCsv);
                    SnowbySettings.setFilters(this, optionCsv.getText().toString());
                }
                else {
                    SnowbySettings.setFilters(this, SnowbySettings.DEFAULT_FILTERS);
                }
                break;
            case R.id.checkbox_snowby_sort_enabled:
                if (checked){
                    EditText optionCsv = findViewById(R.id.sortOptionsCsv);
                    SnowbySettings.setSort(this, optionCsv.getText().toString());
                }
                else {
                    SnowbySettings.setSort(this, SnowbySettings.DEFAULT_SORT);
                }
                break;
        }
    }

}