#!/bin/sh
echo ""
echo "Notice: This Preview is made available to you on the condition that you agree to the Supplemental Terms of Use for Microsoft Azure Previews [https://go.microsoft.com/fwlink/?linkid=2018815], which supplement your agreement [https://go.microsoft.com/fwlink/?linkid=2018657] governing your use of Azure. If you do not have an existing agreement governing your use of Azure, you agree that your agreement governing use of Azure is the Microsoft Online Subscription Agreement [https://go.microsoft.com/fwlink/?linkid=2018755] (which incorporates the Online Services Terms [https://go.microsoft.com/fwlink/?linkid=2018760]). By using the Preview you agree to these terms."
echo ""
eula=false
for arg in "$@"
do
	lowercase=$(echo $arg | tr '[:upper:]' '[:lower:]')
	if [ "$(echo "$lowercase" | cut -c0-4)" == "eula" ]
	then
		substring=${lowercase:5}
		if [ $substring == "accept" ];
		then
			eula=true
		fi
	fi
done

if $eula ;
then
	eval "nginx -g 'daemon off;'"
else
	echo "Missing EULA=accept command line option. You must provide this to continue."
	exit 0
fi
