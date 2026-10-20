import test from 'node:test';import assert from 'node:assert/strict';
import {newCampaign,campaignEvent,campaignSteps,campaignById} from '../src/game/campaigns.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
test('first chapter progresses only through ordered successful action notifications',()=>{
 const g={campaign:newCampaign('river-1503')};
 campaignEvent(g,{kind:'readReport'});campaignEvent(g,{kind:'sell',city:'cadiz',qty:5});assert.equal(g.campaign.completed,false);
 campaignEvent(g,{kind:'buy',qty:0});assert.equal(g.campaign.bought,0);
 campaignEvent(g,{kind:'buy',qty:5});campaignEvent(g,{kind:'sail',to:'cadiz'});
 campaignEvent(g,{kind:'arrival',city:'lisboa'});assert.equal(g.campaign.arrived,false);
 campaignEvent(g,{kind:'arrival',city:'cadiz'});campaignEvent(g,{kind:'sell',city:'cadiz',qty:2});
 assert.equal(g.campaign.completed,false);campaignEvent(g,{kind:'readReport'});assert.equal(g.campaign.completed,true);
 assert.deepEqual(campaignSteps(g),[true,true,true,true,true]);
});
test('unknown ids fail and legacy/free games are unaffected',()=>{
 assert.throws(()=>newCampaign('unknown'));assert.equal(campaignById('unknown'),null);
 const g={};campaignEvent(g,{kind:'buy',qty:1});assert.deepEqual(g,{});assert.deepEqual(campaignSteps(g),[]);
});
test('save/restore retains campaign progress and future chapters cannot complete',()=>{
 const g={day:0,cash:2000,ships:[],market:{},world:{},profile:{home:'cadiz'},campaign:newCampaign('river-1503')};
 campaignEvent(g,{kind:'buy',qty:3});const r=deserialize(serialize(g,'House'),{}).g;
 assert.equal(r.campaign.bought,3);assert.notEqual(r.campaign,g.campaign);
 const f={campaign:newCampaign('wool-1511')};campaignEvent(f,{kind:'buy',qty:3});assert.equal(f.campaign.bought,0);assert.equal(f.campaign.completed,false);
});
