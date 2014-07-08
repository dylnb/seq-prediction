library("rjson")
library("data.table")
library("ggplot2")
library("reshape2")
library("lme4")
json_file <- "seq.json"
json_data <- fromJSON(paste(readLines(json_file), collapse=""))
json_data[[19]]$target
str(json_data[[210]])

acceptables <- function(lex) {
  switch(toString(lex),
         "1" =, "2" = c(1,2),
         "3" =, "4" = c(3,4),
         "5" =, "6" = c(5,6),
         "7" = c(7), "8" = c(8), "9" = c(9))
}


### Basic quality analysis ###
##############################

# check for people overguessing particular syls 
get_guesses <- function(df,trial) {
  if (length(trial$guess) == 0) {return(df)}
  else {return(rbind(df, c(trial$uniqueid, trial$guess[1])))}
}
guesses_df <- as.data.frame(t(data.frame(rep(NA,2))))
colnames(guesses_df) <- c("id", "guess")
gs <- Reduce(get_guesses, json_data, guesses_df)
gs <- data.table(gs[-1,])
gs$guess <- as.factor(gs$guess)
gfreqs <- gs
gfreqs$daz <- gfreqs$guess==0
gfreqs$mer <- gfreqs$guess==1
gfreqs$lev <- gfreqs$guess==2
gfreqs$jes <- gfreqs$guess==3
gfreqs$tid <- gfreqs$guess==4
gfreqs$rud <- gfreqs$guess==5
gfreqs$nav <- gfreqs$guess==6
gfreqs$sib <- gfreqs$guess==7
gfreqs$zor <- gfreqs$guess==8
gdists <- gfreqs[, list(daz=sum(daz)/.N,
                        mer=sum(mer)/.N,
                        lev=sum(lev)/.N,
                        jes=sum(jes)/.N,
                        tid=sum(tid)/.N,
                        rud=sum(rud)/.N,
                        nav=sum(nav)/.N,
                        sib=sum(sib)/.N,
                        zor=sum(zor)/.N), by=id]
scaled_gdists <- cbind(gdists$id,
                       data.table(scale(gdists[,list(daz,mer,lev,jes,tid,rud,nav,sib,zor)])))
setnames(scaled_gdists, 1, "id")
keycols <- colnames(scaled_gdists)
setkeyv(scaled_gdists, keycols)
outliers <- list(scaled_gdists[daz>3], scaled_gdists[mer>3],
                 scaled_gdists[lev>3], scaled_gdists[jes>3],
                 scaled_gdists[jes>3], scaled_gdists[tid>3],
                 scaled_gdists[rud>3], scaled_gdists[nav>3],
                 scaled_gdists[sib>3], scaled_gdists[zor>3])
# users who chose a particular syl more often than 98.7% of other users
heavy_users <- Reduce(function(x,y){merge(x,y,all=T)}, outliers)

gfreq_trials <- freqs
gfreq_trials[, `:=`(n=1:.N, grp=rep(1:6, each=30)[1:.N]), by=id]
setkey(gfreq_trials, id)
plot_turker_syl_dist <- function(user_id) {
  melted_gdist <- melt(
    gfreq_trials[user_id,
                 list(daz=sum(daz)/.N,
                      mer=sum(mer)/.N,
                      lev=sum(lev)/.N,
                      jes=sum(jes)/.N,
                      tid=sum(tid)/.N,
                      rud=sum(rud)/.N,
                      nav=sum(nav)/.N,
                      sib=sum(sib)/.N,
                      zor=sum(zor)/.N),
                 by=grp],
       id=c("grp"), variable.name="syl", value.name="freq"
  )
  ggplot(data=melted_gdist, aes(x=factor(grp), y=freq, fill=syl)) +
    geom_bar(colour="black", stat="identity",
             position=position_dodge(),
             size=.3) + theme_bw()
}

# check percentage of targets per syl
get_targets <- function(df,trial) {
  if (length(trial$target) == 0) {return(df)}
  else {return(rbind(df, c(trial$uniqueid, trial$target[1])))}
}
targets_df <- as.data.frame(t(data.frame(rep(NA,2))))
colnames(targets_df) <- c("id", "target")
ts <- Reduce(get_targets, json_data, targets_df)
ts <- data.table(ts[-1,])
ts$target <- as.factor(ts$target)
tfreqs <- ts
tfreqs$daz <- tfreqs$target==0
tfreqs$mer <- tfreqs$target==1
tfreqs$lev <- tfreqs$target==2
tfreqs$jes <- tfreqs$target==3
tfreqs$tid <- tfreqs$target==4
tfreqs$rud <- tfreqs$target==5
tfreqs$nav <- tfreqs$target==6
tfreqs$sib <- tfreqs$target==7
tfreqs$zor <- tfreqs$target==8
tdists <- tfreqs[, list(daz=sum(daz)/.N,
                        mer=sum(mer)/.N,
                        lev=sum(lev)/.N,
                        jes=sum(jes)/.N,
                        tid=sum(tid)/.N,
                        rud=sum(rud)/.N,
                        nav=sum(nav)/.N,
                        sib=sum(sib)/.N,
                        zor=sum(zor)/.N), by=id]


### Analysis of data ###
########################

get_performances <- function(df,trial) {
  g = trial$guess
  t = trial$target
  if (length(g) == 0) {return(df)}
  if (g[1] %in% acceptables(t[1])) {
    return(rbind(df, c(trial$uniqueid,
                       trial$condition,
                       trial$counterbalance,
                       paste(trial$sequence, collapse=""),
                       length(trial$sequence),
                       (trial$inter - 199) / length(trial$sequence),
                       1)))
  } else {
    return(rbind(df, c(trial$uniqueid,
                       trial$condition,
                       trial$counterbalance,
                       paste(trial$sequence, collapse=""),
                       length(trial$sequence),
                       (trial$inter - 199) / length(trial$sequence),
                       0)))
  }
}
performance_df <- as.data.frame(t(data.frame(rep(NA,7))))
colnames(performance_df) <- c("id",
                              "cond",
                              "counter",
                              "sequence",
                              "seq.length",
                              "inter",
                              "performance")
data <- Reduce(get_performances, json_data, performance_df)
data <- data.table(data[-1,])
data$cond <- factor(data$cond, labels=c("fsa", "cfg"))
data$counter <- factor(data$counter, labels=c("one", "three"))
data$seq.length <- as.numeric(data$seq.length)
data$inter <- as.numeric(data$inter)
data$performance <- as.numeric(data$performance)
setkey(data, id)
data[, `:=`(n=1:.N,
            window=c(rep(1:8, each=20), rep(8, .N-160)),
            stage=c(rep(1:3, each=55), rep(3, .N-165)),
            stage4=c(rep(1:4, each=40), rep(4, .N-160))), by=id]
tmp <- data[, list(acc=100*sum(performance)/.N), by=id]
trial_vars <- c("sequence", "seq.length", "performance",
                "inter", "n", "window")
accuracies <- data[tmp, mult="first"][,!trial_vars, with=F]
accuracies$acc.z <- scale(accuracies$acc)
outs <- accuracies[acc.z > 2.5] # scores suspiciously good
data_outs <- data[!outs]
accuracies_outs <- accuracies[!outs] # overall outliers removed

# plot overall performance
stripchart(acc ~ counter + cond,
           vertical=TRUE,
           data=accuracies_outs,
           method="stack", jitter=0.1, ylim=c(0, 60),
           at=c(1.33,2,3.33,4),
           col=rgb(0,0,1,0.4), pch=16,
           ylab="% Correct", xlab="Language and Prediction Window Condition",
           group.names=c("FSA1", "FSA3", "CFG1", "CFG3"),
           cex.lab=1.4, cex.axis=1.4, cex.sub=1.4)
overall_means <- c(mean(accuracies_outs[cond=="fsa"][counter=="one"]$acc),
                   mean(accuracies_outs[cond=="fsa"][counter=="three"]$acc),
                   mean(accuracies_outs[cond=="cfg"][counter=="one"]$acc),
                   mean(accuracies_outs[cond=="cfg"][counter=="three"]$acc))
# points(c(1,2,3,4), overall_means, pch=18, cex=1.5, lwd=2)
segments(c(1.33,2,3.33,4)-0.1, overall_means, c(1.33,2,3.33,4)+0.1, overall_means, lwd=4)

# plot early performance
early_tmp <- data_outs[window<3, list(acc=sum(performance)/.N), by=id]
early_accuracies <- data_outs[early_tmp, mult="first"][,!trial_vars, with=F]
early_accuracies$acc.z <- scale(early_accuracies$acc)
early_outs <- early_accuracies[acc.z > 2.5]
early_accuracies_outs <- early_accuracies[!early_outs]
stripchart(acc ~ counter + cond,
           vertical=TRUE,
           data=early_accuracies_outs,
           method="stack", jitter=0.1, ylim=c(0, 0.6))
early_means <- c(mean(early_accuracies_outs[cond=="fsa"][counter=="one"]$acc),
                 mean(early_accuracies_outs[cond=="fsa"][counter=="three"]$acc),
                 mean(early_accuracies_outs[cond=="cfg"][counter=="one"]$acc),
                 mean(early_accuracies_outs[cond=="cfg"][counter=="three"]$acc))
points(c(1,2,3,4), early_means, pch=17, cex=1.5, lwd=2)
text(0.25 + c(1, 2, 3, 4), early_means, labels=round(100*early_means,1), cex=0.8)
title(main="Accuracy in first 40 trials")

# plot late performance
late_tmp <- data_outs[window>5, list(acc=100*sum(performance)/.N), by=id]
late_accuracies <- data_outs[late_tmp, mult="first"][,!trial_vars, with=F]
late_accuracies$acc.z <- scale(late_accuracies$acc)
late_outs <- late_accuracies[acc.z > 2.5]
late_accuracies_outs <- late_accuracies[!late_outs]
# boxplot(acc ~ counter + cond,
#         data=late_accuracies_outs,
#         at=c(1.33,2,3.33,4),
#         boxwex=0.2)
stripchart(acc ~ counter + cond,
           vertical=TRUE,
           data=late_accuracies_outs,
           method="stack", jitter=0.1,
           at=c(1.33,2,3.33,4),
           col=rgb(0,0,1,0.4), pch=16,
           ylab="% Correct", xlab="Language x Prediction Window",
           group.names=c("FSA1", "FSA3", "CFG1", "CFG3"))
late_means <- c(mean(late_accuracies_outs[cond=="fsa"][counter=="one"]$acc),
                mean(late_accuracies_outs[cond=="fsa"][counter=="three"]$acc),
                mean(late_accuracies_outs[cond=="cfg"][counter=="one"]$acc),
                mean(late_accuracies_outs[cond=="cfg"][counter=="three"]$acc))
# points(c(1,2,3,4), overall_means, pch=18, cex=1.5, lwd=2)
segments(c(1.33,2,3.33,4)-0.05, late_means, c(1.33,2,3.33,4)+0.1, late_means, lwd=4)
text(c(1.1,2.3,3.1,4.3), late_means, labels=round(late_means,1), cex=0.8)



late_overs <- data_outs[window>5, list(acc=sum(performance)/.N), by=c("cond", "counter")]
ggplot(late_overs, aes(x=counter, y=acc, linetype=cond, group=cond)) +
  geom_point() + 
  geom_line() +
  theme_bw()

# who learned?
learners <- early_accuracies[late_accuracies][acc.1 > acc, list(id, cond, counter)]
dcast.data.table(learners, cond ~ counter) # check how many people improved per condition

# plot early performance among learners
learners_early_y <- data_outs[window<3, list(acc=sum(performance)/.N), by=id][learners]
learners_early_accuracies <- data_outs[learners_early_y, mult="first"][,!trial_vars, with=F]
learners_early_accuracies$acc.z <- scale(learners_early_accuracies$acc)
learners_early_outs <- learners_early_accuracies[acc.z > 2.5]
learners_early_accuracies_outs <- learners_early_accuracies[!learners_early_outs]
stripchart(acc ~ counter + cond, vertical=TRUE, data=learners_early_accuracies_outs,
           method="stack", jitter=0.1, ylim=c(0, 0.6))
learners_early_means <- c(mean(learners_early_accuracies_outs[cond=="fsa"][counter=="one"]$acc),
                 mean(learners_early_accuracies_outs[cond=="fsa"][counter=="three"]$acc),
                 mean(learners_early_accuracies_outs[cond=="cfg"][counter=="one"]$acc),
                 mean(learners_early_accuracies_outs[cond=="cfg"][counter=="three"]$acc))
points(c(1,2,3,4), learners_early_means, pch=17, cex=1.5, lwd=2)
text(0.25 + c(1, 2, 3, 4), learners_early_means, labels=round(100*learners_early_means,1), cex=0.8)
title(main="Accuracy of learners in first 40 trials")

# plot late performance among learners
learners_late_tmp <- data_outs[window>5, list(acc=sum(performance)/.N), by=id][learners]
learners_late_accuracies <- data_outs[learners_late_tmp, mult="first"][,!trial_vars, with=F]
learners_late_accuracies$acc.z <- scale(learners_late_accuracies$acc)
learners_late_outs <- learners_late_accuracies[acc.z > 2.5]
learners_late_accuracies_outs <- learners_late_accuracies[!learners_late_outs]
stripchart(acc ~ counter + cond,
           vertical=TRUE,
           data=learners_late_accuracies_outs,
           method="stack", jitter=0.1, ylim=c(0, 0.6))
learners_late_means <- c(mean(learners_late_accuracies_outs[cond=="fsa"][counter=="one"]$acc),
                         mean(learners_late_accuracies_outs[cond=="fsa"][counter=="three"]$acc),
                         mean(learners_late_accuracies_outs[cond=="cfg"][counter=="one"]$acc),
                         mean(learners_late_accuracies_outs[cond=="cfg"][counter=="three"]$acc))
points(c(1,2,3,4), learners_late_means, pch=17, cex=1.5, lwd=2)
text(0.25 + c(1, 2, 3, 4), learners_late_means, labels=round(100*learners_late_means,1), cex=0.8)
title(main="Accuracy of learners in last 65 trials")


# performance over time windows, factored by cond and counter
window_accuracies <- data_outs[, list(acc=sum(performance)/.N),
                               by=c("cond", "counter", "window")]
window_accuracies$window <- as.factor(window_accuracies$window)
ggplot(data=window_accuracies,
       aes(x=window, y=acc,
           color=cond, linetype=counter,
           group=interaction(cond, counter))) +
  geom_line() +
  geom_point() +
  ggtitle("Performance over time")

# performance over THREE time stages, factored by cond and counter
stage_accuracies <- data_outs[, list(acc=sum(performance)/.N),
                               by=c("cond", "counter", "stage")]
stage_accuracies$stage <- as.factor(stage_accuracies$stage)
ggplot(data=stage_accuracies,
       aes(x=stage, y=acc,
           color=cond, linetype=counter,
           group=interaction(cond, counter))) +
  geom_line() +
  geom_point() +
  ggtitle("Performance over time, in three stages")

# performance over FOUR time stages, factored by cond and counter
stage4_accuracies <- data_outs[, list(acc=sum(performance)/.N),
                               by=c("cond", "counter", "stage4")]
stage4_accuracies$stage4 <- as.factor(stage4_accuracies$stage4)
ggplot(data=stage4_accuracies,
       aes(x=stage4, y=acc,
           color=cond, linetype=counter,
           group=interaction(cond, counter))) +
  geom_line() +
  geom_point() +
  ggtitle("Performance over time, in four stages")


# performance over time windows among learners, factored by cond and counter
window_accuracies <- data_outs[learners][, list(acc=sum(performance)/.N),
                                         by=c("cond", "counter", "window")]
window_accuracies$window <- as.factor(window_accuracies$window)
ggplot(data=window_accuracies,
       aes(x=window, y=acc,
           color=cond, linetype=counter,
           group=interaction(cond, counter))) +
  geom_line() +
  geom_point() +
  ggtitle("Performance over time among learners") +
  theme_bw()

# performance over time stages among learners, factored by cond and counter
stage_accuracies <- data_outs[learners][, list(acc=sum(performance)/.N),
                                        by=c("cond", "counter", "stage")]
stage_accuracies$stage <- as.factor(stage_accuracies$stage)
ggplot(data=stage_accuracies,
       aes(x=stage, y=acc,
           color=cond, linetype=counter,
           group=interaction(cond, counter))) +
  geom_line() +
  geom_point() +
  ggtitle("Performance over stages among learners") + 
  theme_bw()



# average accuracies over time
gram_converter <- Vectorize(function(gram) {
  switch(toString(gram),
         "fsa" = 29,
         "cfg" = 30)
})
ma <- function(x,n) { as.numeric(filter(x, rep(1/n,n), sides=1)) }
data_ma_tmp <- data_outs[,list(agg.perf=sum(performance)),
                         by=c("cond", "counter", "n")]
data_ma <- na.omit(data_ma_tmp[,list(n, mov.avg=ma(agg.perf, 33)),
                               by=c("cond", "counter")])
data_ma$mov.avg <- 100 * data_ma$mov.avg / gram_converter(data_ma$cond)

ggplot(data_ma, aes(x=n, y=mov.avg, color=cond,
                    linetype=counter, group=cond:counter)) +
  geom_point(alpha=0.3) +
  geom_line(alpha=0.3) +
  geom_smooth(size=1) +
  theme_bw() +
  scale_color_discrete(name="Grammar",
                       breaks=c("fsa", "cfg"),
                       labels=c("FSA", "CFG")) +
  scale_linetype_discrete(name="Prediction Length",
                          breaks=c("one", "three"),
                          labels=c("1", "3")) +
  xlab("Trial Number") +
  ylab("Avg. Accuracy Across 33 Previous Trials")
                      

### Statistical Analyses ###
############################

mm_simple_overall <- glmer(data=data_outs,
                           family=binomial,
                           control=glmerControl(optimizer="bobyqa"),
                           performance ~ 1 + (1|id) + (1|sequence) + stage + cond*counter)

mm_full_overall <- glmer(data=data_outs,
                         family=binomial,
                         control=glmerControl(optimizer="bobyqa"),
                         performance ~ 1 + (1|id) + (1|sequence) +
                           stage + seq.length + inter + cond*counter)

anova(mm_simple_overall, mm_full_overall) # no difference in results, so
                                          # simple model marginally better

mm_simple_late <- glmer(data=data_outs[window>5],
                        family=binomial,
                        control=glmerControl(optimizer="bobyqa"),
                        performance ~ 1 + (1|id) + (1|sequence) + cond*counter)

mm_full_late <- glmer(data=data_outs[window>5],
                      family=binomial,
                      control=glmerControl(optimizer="bobyqa"),
                      performance ~ 1 + (1|id) + (1|sequence) +
                        seq.length + inter + cond*counter)

anova(mm_simple_late, mm_full_late) # mm_full_late better model because inter
                                    # is a strong predictor in this late stage



mmm_simple_overall <- glmer(data=data_outs,
                            family=binomial,
                            control=glmerControl(optimizer="bobyqa"),
                            performance ~ 1 + (1|id) + (1|sequence) + cond*counter*stage)

mmm_full_overall <- glmer(data=data_outs,
                          family=binomial,
                          control=glmerControl(optimizer="bobyqa"),
                          performance ~
                            1 + (1|id) + (1|sequence) +
                            seq.length + inter + cond*counter*stage)

anova(mmm_simple_overall, mmm_full_overall) # no difference in results, so
                                            # simple model does marginally better

anova(mm_simple_overall, mmm_simple_overall) # smaller model better, despite significant
                                             # three-way-interaction

mm_simple_threes <- glmer(data=data_outs[counter=="three"],
                          family=binomial,
                          control=glmerControl(optimizer="bobyqa"),
                          performance ~ 1 + (1|id) + (1|sequence) + cond*stage)
# standard deviations
se <- sqrt(diag(vcov(mm)))
tab <- cbind(Est = fixef(mm),
             LL  = fixef(mm) - 1.96 * se,
             UL  = fixef(mm) + 1.96 * se)

setkeyv(data_outs, c("cond", "counter", "n"))
ttmp1 <- data_outs[CJ("cfg", c("one", "three"), 100:165),
                     list(acc=sum(performance)/.N), by=id]
setkey(data_outs, id)
setkey(ttmp1, id)
t_accs1 <- data_outs[ttmp1, mult="first"][,!c(trial_vars, "stage", "stage4"), with=F]

setkeyv(data_outs, c("cond", "counter", "n"))
ttmp2 <- data_outs[J(c("cfg", "fsa"), c("three", "one"), 100:165),
                   list(acc=sum(performance)/.N), by=id]
setkey(data_outs, id)
setkey(ttmp2, id)
t_accs2 <- data_outs[ttmp2, mult="first"][,!c(trial_vars, "stage", "stage4"), with=F]


### Compare n-gram models for FSA ###
#####################################
