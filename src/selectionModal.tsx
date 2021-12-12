import React, {useEffect, useState} from 'react';
import {View, Modal, StyleSheet, Text, StatusBar, ScrollView} from 'react-native';

import {TouchableWithoutFeedback, TouchableOpacity} from 'react-native';
import CheckBox from '@react-native-community/checkbox';

import Colors from './colors';

interface Item {
  title?: string | number;
  language?: string;
  index?: number;
}

export interface SelectionModalProps {
  title?: string;
  width?: number;
  height?: number;
  isVisible: boolean;
  onSelect?: (item?: Item) => void;
  onCancel?: () => void;
  selected?: Item;
  data?: Array<Item>;
  [key: string]: any;
}

const SelectionModal = (props: SelectionModalProps) => {
  const {
    title,
    data = [],
    isVisible = false,
    onSelect = () => {},
    onCancel = () => {},
    width = 300,
    height = 300,
    selected = {},
  } = props;

  const containerSize = {
    width: width * (width > height ? 0.4 : 0.8),
    height: height * (width > height ? 0.7 : 0.5),
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} statusBarTranslucent={true}>
      <StatusBar hidden />
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.container}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.listContainer, containerSize]}>
              {title ? <Text style={styles.header}>{title}</Text> : null}
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}>
                {data.map(item => (
                  <TouchableOpacity onPress={() => onSelect(item)} key={item.title}>
                    <View style={styles.item}>
                      <CheckBox
                        value={selected?.title === item.title}
                        onValueChange={() => onSelect(item)}
                        tintColors={{true: Colors.witeAlpha(80), false: Colors.witeAlpha(50)}}
                      />
                      <Text style={styles.title}>
                        {`${item?.language ?? item?.title ?? item?.index}`.toString().toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {title === 'Playback Speed' ? null : (
                  <View style={styles.item}>
                    <CheckBox
                      value={!selected?.title}
                      onValueChange={() => onSelect(undefined)}
                      tintColors={{true: Colors.witeAlpha(80), false: Colors.witeAlpha(50)}}
                    />
                    <Text style={styles.title}>NONE</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default SelectionModal;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: Colors.witeAlpha(90),
    marginHorizontal: 10,
  },
  listContainer: {
    backgroundColor: Colors.blackAlpha(90),
    borderRadius: 8,
  },
  scrollContainer: {
    paddingTop: 10,
    padding: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 40,
    padding: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginHorizontal: 30,
    marginTop: 20,
  },
});
