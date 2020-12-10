########### Python Form Recognizer Async Analyze #############
import json
import time
import getopt
import sys
import os
import asyncio
import aiohttp

async def main(argv):
    input_dir, output_dir, file_type = getArguments(argv)
    allSupportedFiles=False
    if not file_type:
        allSupportedFiles=True
    if not output_dir:
        output_dir="./"
    if (os.path.isdir(input_dir) and os.path.isdir(output_dir)):
        analysisTasks=[]
        with os.scandir(input_dir) as entries:
            for entry in entries:
                if entry.is_file():
                    if not file_type:
                        file_type=inferrType(str.lower(entry.name))
                    if (file_type and isSupportedFile(str.lower(entry.name),file_type)):
                        analysisTasks.append(runAnalysis(input_dir, entry.name,output_dir,file_type))
                    if allSupportedFiles:
                        file_type=''
        await asyncio.gather(*analysisTasks)
        print("Analysis completed.")
    else:
        printCommandDescription(2)

async def runAnalysis(input_dir,input_file, output_dir, file_type):
   # Endpoint URL
    endpoint = "<endpoint>"
    # Subscription Key
    apim_key = "<subscription_key>"
    # API version
    API_version = "<API_version>"

    post_url = endpoint + "/formrecognizer/%s/layout/analyze" % (API_version)
    params = {
        "includeTextDetails": "True"
    }

    headers = {
        # Request headers
        'Content-Type': file_type,
        'Ocp-Apim-Subscription-Key': apim_key,
    }
    try:
        with open(input_dir+"/"+input_file, "rb") as f:
            data_bytes = f.read()
    except IOError:
        print("Inputfile "+ input_file +" not accessible.")
        return

    try:
        print("Initiating analysis "+ input_file+" ...")

        async with aiohttp.ClientSession() as session:
            async with session.post(url=post_url, data = data_bytes, headers = headers, params = params) as resp:
                if resp.status != 202:
                    print("POST analyze failed for file %s:\n%s" % (input_file, json.dumps(resp.json())))
                    return
                print("POST analyze succeeded for file %s:\n%s" % (input_file, resp.headers))
                get_url = resp.headers["operation-location"]
                n_tries = 15
                n_try = 0
                wait_sec = 5
                max_wait_sec = 60
                print()
                print("Getting analysis results for file "+ input_file+" ...")
                while n_try < n_tries:
                    try:
                        async with aiohttp.ClientSession() as session:
                            async with session.get(url=get_url,headers = {"Ocp-Apim-Subscription-Key": apim_key}) as resp:
                                if resp.status != 200:
                                    print("GET analyze results failed for file %s:\n%s" % (input_file, json.dumps(resp_json)))
                                    return
                                resp_json = await resp.json()
                                status = resp_json["status"]
                                if status == "succeeded":
                                    if output_dir:
                                        try:
                                            with open(output_dir+"/"+input_file+".json", 'w') as outfile:
                                                json.dump(resp_json, outfile, indent=2, sort_keys=True)
                                                print("Analysis succeeded for file %s" % input_file)
                                                return
                                        except IOError:
                                            print("Output file: "+ input_file + " not creatable")
                                
                                if status == "failed":
                                    print("Analysis failed:\n%s" % json.dumps(resp_json))
                                    return

                        time.sleep(wait_sec)
                        n_try += 1
                        wait_sec = min(2*wait_sec, max_wait_sec)     
                    except Exception as e:
                        msg = "GET analyze results failed for file %s:\n%s" % (input_file,str(e))
                        print(msg)
                        return
                print("Analyze operation for file "+ input_file +" did not complete within the allocated time.")

    except Exception as e:
        print("POST analyze failed for file %s:\n%s" % (input_file, str(e)))
        

def getArguments(argv):
    input_dir = ''
    file_type = ''
    output_dir = ''
    try:
        opts, args = getopt.gnu_getopt(argv, "ht:o:", [])
    except getopt.GetoptError:
        printCommandDescription(2)

    for opt, arg in opts:
        if opt == '-h':
            printCommandDescription()

    if len(args) != 1:
        printCommandDescription()
    else:
        input_dir = args[0]
    
    for opt, arg in opts:
        if opt == '-t':
            if arg not in ('application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'image/bmp'):
                print('Type ' + file_type + ' not supported')
                sys.exit()
            else:
                file_type = arg
        
        if opt == '-o':
            output_dir = arg

    return (input_dir, output_dir, file_type)
def isSupportedFile(input_file, file_type):
    if (file_type == 'application/pdf' and input_file.endswith('.pdf')):
        return True
    elif (file_type == 'image/jpeg' and (input_file.endswith('.jpeg') or input_file.endswith('.jpg'))):
        return True
    elif (file_type == 'image/bmp' and input_file.endswith('.bmp')):
        return True
    elif (file_type == 'image/png' and input_file.endswith('.png')):
        return True
    elif (file_type == 'image/tiff' and input_file.endswith('.tiff')):
        return True
    else:
        return False

def inferrType(input_file):
    filename, file_extension = os.path.splitext(input_file)
    if file_extension ==  '': 
        print('File extension could not be inferred from inputfile. Ignore '+ input_file)
        return  
    elif file_extension == '.pdf':
        return 'application/pdf'
    elif file_extension ==  '.jpeg' or file_extension == '.jpg':
        return 'image/jpeg'
    elif file_extension == '.bmp':
        return 'image/bmp'
    elif file_extension ==  '.png':
        return 'image/png'
    elif file_extension ==  '.tiff':
        return 'image/tiff'
    else:
        print('File extension ' + file_extension + ' not supported, ingore '+ input_file)

def printCommandDescription(exit_status=0):
    print('analyze.py <inputdir> [-t <type>] [-o <outputdir>]')
    print
    print('If type option is not provided, type will be inferred from file extension.')
    sys.exit(exit_status)

if __name__ == '__main__':
    asyncio.run(main(sys.argv[1:]))
